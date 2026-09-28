(() => {
  'use strict';

  const STORE_KEY = 'chip-english.v1';
  const LESSON_XP = 15, PERFECT_BONUS = 5, REVIEW_XP = 10, SPEAK_XP = 15;
  const PASS = 0.75;          // điểm đọc tối thiểu để tính là đọc đúng (0–1)
  const GOALS = [
    { xp: 15, label: 'Nhẹ nhàng', sub: '1 bài / ngày' },
    { xp: 30, label: 'Chăm chỉ', sub: '2 bài / ngày' },
    { xp: 45, label: 'Siêu sao', sub: '3 bài / ngày' },
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // Ảnh minh họa của từ: dùng `img` nếu có, không thì dùng emoji
  const pic = (w) => w.img ? `<img class="word-img" src="${esc(w.img)}" alt="" onerror="this.replaceWith(document.createTextNode('${w.emoji}'))">` : w.emoji;

  // ---------- State ----------
  const defaultState = () => ({
    profile: null,            // { name, grade, reminder:'19:00', goal:15, unlockAll:false }
    streak: { count: 0, best: 0, last: null },
    days: {},                 // 'YYYY-MM-DD' -> xp
    xp: 0,
    units: {},                // 'g1:u3' -> { stars }
    speak: {},                // 'g1:u3' -> { stars } (luyện đọc)
    words: {},                // 'g1:u3:apple' -> { c, w }
    remindedOn: null,
  });
  let S = load();
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return Object.assign(defaultState(), JSON.parse(raw)); } catch (e) {}
    return defaultState();
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }

  // ---------- Dates & streak ----------
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return keyOf(d); };
  const today = () => daysAgo(0);
  const studiedToday = () => S.streak.last === today();
  const currentStreak = () => (S.streak.last === today() || S.streak.last === daysAgo(1)) ? S.streak.count : 0;
  const streakLost = () => S.streak.count > 0 && currentStreak() === 0;
  const todayXP = () => S.days[today()] || 0;

  function recordXP(xp) {
    const t = today();
    S.xp += xp;
    S.days[t] = (S.days[t] || 0) + xp;
    let extended = false;
    if (S.streak.last !== t) {
      S.streak.count = S.streak.last === daysAgo(1) ? S.streak.count + 1 : 1;
      S.streak.last = t;
      S.streak.best = Math.max(S.streak.best, S.streak.count);
      extended = true;
    }
    save();
    return extended;
  }

  function reminderPassed() {
    if (!S.profile) return false;
    const [h, m] = S.profile.reminder.split(':').map(Number);
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  }

  // ---------- Grade data ----------
  const gradeInfo = (id) => window.GRADES.find((g) => g.id === id);
  function loadGrade(id) {
    window.GRADE_DATA = window.GRADE_DATA || {};
    if (window.GRADE_DATA[id]) return Promise.resolve(window.GRADE_DATA[id]);
    const info = gradeInfo(id);
    if (!info || !info.src) return Promise.resolve(null);
    return new Promise((res) => {
      const s = document.createElement('script');
      s.src = info.src;
      s.onload = () => res(window.GRADE_DATA[id] || null);
      s.onerror = () => res(null);
      document.head.appendChild(s);
    });
  }
  const unitKey = (g, u) => `g${g}:u${u.id}`;
  const wordKey = (g, u, w) => `g${g}:u${u.id}:${w.en}`;
  function allWords(g, data) {
    return data.units.flatMap((u) => u.words.map((w) => ({ ...w, key: wordKey(g, u, w), unit: u })));
  }

  // ---------- Audio ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /google|samantha|aria|jenny|zira/i.test(v.name))
      || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(word, rate = 0.8) {
    if (word && word.audio) { new Audio(word.audio).play().catch(() => {}); return; }
    const text = typeof word === 'string' ? word : word.en;
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate; if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  let ac;
  function tones(freqs, dur = 0.12, type = 'sine') {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      let t = ac.currentTime;
      freqs.forEach((f) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.85;
      });
    } catch (e) {}
  }
  const sfx = {
    good: () => tones([660, 880, 1175], 0.1),
    bad: () => tones([240, 190], 0.18, 'triangle'),
    win: () => tones([523, 659, 784, 1047, 1319], 0.12),
    tap: () => tones([520], 0.05),
  };

  // ---------- UI helpers ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function modal(html, { onMount } = {}) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
    const close = () => { root.innerHTML = ''; };
    root.querySelector('.modal-backdrop').addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) close(); });
    onMount && onMount(root.querySelector('.modal'), close);
    return close;
  }
  function confetti() {
    const colors = ['#7C5CFF', '#FFB020', '#2BC48A', '#FF5A8A', '#39A7FF'];
    const box = document.createElement('div'); box.className = 'confetti';
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = pick(colors);
      p.style.animationDelay = Math.random() * 0.6 + 's';
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3500);
  }
  const bubble = (mood, text, size = 110) => `
    <div class="mascot-row">
      <div class="mascot-wrap">${mascotSVG(mood, size)}</div>
      <div class="bubble">${text}</div>
    </div>`;

  // ---------- Mascot mood & message ----------
  function mascotState() {
    const name = esc(S.profile.name);
    const n = currentStreak();
    if (studiedToday()) {
      if (todayXP() >= S.profile.goal) return { mood: 'cheer', text: `Giỏi quá ${name}! Hôm nay đạt mục tiêu rồi. Chuỗi <b>${n} ngày</b> 🔥` };
      return { mood: 'happy', text: `Đã giữ chuỗi <b>${n} ngày</b> 🔥 Học thêm một bài để đạt mục tiêu nhé!` };
    }
    if (streakLost()) return { mood: 'sad', text: `Chíp nhớ ${name} lắm… Chuỗi cũ đã mất rồi. Mình bắt đầu chuỗi mới nhé!` };
    if (reminderPassed()) return { mood: 'sad', text: n > 0 ? `Đến giờ học rồi ${name} ơi! Đừng để mất chuỗi <b>${n} ngày</b> 🔥` : `Đến giờ học rồi ${name} ơi! Học với Chíp 5 phút nhé!` };
    const h = new Date().getHours();
    if (h < 6 || h >= 22) return { mood: 'sleep', text: `Khuya rồi… Chíp buồn ngủ quá. Hẹn ${name} lúc <b>${S.profile.reminder}</b> nhé!` };
    return { mood: 'happy', text: `Chào ${name}! Hôm nay mình học từ mới nhé. Chíp sẽ nhắc lúc <b>${S.profile.reminder}</b> ⏰` };
  }

  // ---------- Screens ----------
  let view = 'home';
  let L = null; // current lesson

  function render() {
    if (!S.profile) return renderOnboarding();
    if (view === 'lesson' && L) return renderLesson();
    if (view === 'settings') return renderSettings();
    if (view === 'speak') return renderSpeakHome();
    return renderHome();
  }

  // Khung chung: thanh điều hướng (dưới trên điện thoại, bên trái trên iPad/PC) + nội dung
  const NAV = [
    { id: 'home', icon: '🏠', label: 'Trang chủ' },
    { id: 'speak', icon: '🎤', label: 'Luyện đọc' },
    { id: 'review', icon: '🔁', label: 'Ôn tập' },
    { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
  ];
  function shell(active, inner) {
    app.innerHTML = `
      <div class="shell">
        <nav class="nav" aria-label="Điều hướng">
          <div class="nav-brand">${mascotSVG('happy', 40)}<span>Chíp English</span></div>
          ${NAV.map((it) => `<button class="nav-item ${it.id === active ? 'active' : ''}" data-nav="${it.id}">
            <span class="nav-icon">${it.icon}</span><span class="nav-label">${it.label}</span></button>`).join('')}
        </nav>
        <main class="shell-main">${inner}</main>
      </div>`;
    $$('.nav-item').forEach((b) => b.onclick = async () => {
      const id = b.dataset.nav;
      if (id === 'review') {
        const g = S.profile.grade, data = await loadGrade(g);
        const seen = data ? allWords(g, data).filter((w) => S.words[w.key]).length : 0;
        if (seen < 4) return toast('Học ít nhất 1 Unit để mở phần Ôn tập nhé!');
        return startReview(g, data);
      }
      if (id !== view) { view = id; render(); }
    });
  }

  // Onboarding
  function renderOnboarding(step = 0, draft = { name: '', grade: 1, reminder: '19:00', goal: 15 }) {
    const gradeOpts = window.GRADES.map((g) => `<option value="${g.id}" ${g.id === draft.grade ? 'selected' : ''} ${g.src ? '' : 'disabled'}>${g.name}${g.src ? '' : ' (sắp có)'}</option>`).join('');
    const steps = [
      () => `
        ${bubble('cheer', 'Xin chào! Mình là <b>Chíp</b> 🐥<br>Mình sẽ cùng bạn học từ vựng tiếng Anh mỗi ngày!', 130)}
        <label class="field"><span>Bạn tên là gì?</span>
          <input id="ob-name" maxlength="20" placeholder="Ví dụ: Bin" value="${esc(draft.name)}" autocomplete="off"></label>
        <label class="field"><span>Bạn học lớp mấy?</span>
          <select id="ob-grade">${gradeOpts}</select></label>`,
      () => `
        ${bubble('think', 'Mỗi ngày bạn muốn học bao nhiêu?')}
        <div class="choice-list">${GOALS.map((g) => `
          <button class="choice ${g.xp === draft.goal ? 'active' : ''}" data-goal="${g.xp}">
            <b>${g.label}</b><span>${g.sub}</span></button>`).join('')}</div>`,
      () => `
        ${bubble('happy', 'Mấy giờ Chíp nhắc bạn học? ⏰<br>Học đều mỗi ngày để giữ chuỗi 🔥 nhé!')}
        <label class="field"><span>Giờ nhắc học</span>
          <input id="ob-time" type="time" value="${draft.reminder}"></label>
        <p class="hint">Bạn có thể bật thông báo và thêm nhắc nhở vào lịch điện thoại ở phần Cài đặt.</p>`,
    ];
    app.innerHTML = `
      <section class="screen onboarding">
        <div class="dots">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <div class="ob-body">${steps[step]()}</div>
        <div class="ob-actions">
          ${step > 0 ? '<button class="btn btn-ghost" id="ob-back">Quay lại</button>' : ''}
          <button class="btn btn-primary" id="ob-next">${step === steps.length - 1 ? 'Bắt đầu học!' : 'Tiếp tục'}</button>
        </div>
      </section>`;
    $$('.choice[data-goal]').forEach((b) => b.onclick = () => { draft.goal = +b.dataset.goal; $$('.choice').forEach((x) => x.classList.toggle('active', x === b)); });
    const back = $('#ob-back'); if (back) back.onclick = () => renderOnboarding(step - 1, draft);
    $('#ob-next').onclick = () => {
      if (step === 0) {
        draft.name = $('#ob-name').value.trim();
        draft.grade = +$('#ob-grade').value;
        if (!draft.name) { $('#ob-name').focus(); return toast('Bạn nhập tên nhé!'); }
      }
      if (step === 2) draft.reminder = $('#ob-time').value || '19:00';
      if (step < steps.length - 1) return renderOnboarding(step + 1, draft);
      S.profile = { ...draft, unlockAll: false };
      save(); view = 'home'; render();
    };
  }

  // Home
  async function renderHome() {
    const g = S.profile.grade;
    const data = await loadGrade(g);
    const info = gradeInfo(g);
    const n = currentStreak();
    const ms = mascotState();
    const goalPct = Math.min(100, Math.round((todayXP() / S.profile.goal) * 100));
    const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const week = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const k = keyOf(d);
      return `<div class="day ${S.days[k] ? 'done' : ''} ${i === 6 ? 'today' : ''}"><span>${wd[d.getDay()]}</span><i>${S.days[k] ? '🔥' : ''}</i></div>`;
    }).join('');

    let path = '<p class="empty">Chưa có dữ liệu cho lớp này.</p>';
    if (data) {
      let prevDone = true;
      path = data.units.map((u, i) => {
        const st = S.units[unitKey(g, u)];
        const locked = !S.profile.unlockAll && !prevDone;
        const isNext = !locked && !st;
        prevDone = !!st;
        const offset = [0, 60, 90, 60, 0, -60, -90, -60][i % 8];
        const stars = st ? '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars) : '';
        return `
          <div class="node-wrap" style="--x:${offset}px">
            ${isNext ? `<div class="node-mascot">${mascotSVG('happy', 54)}</div>` : ''}
            <button class="node ${st ? 'done' : ''} ${locked ? 'locked' : ''} ${isNext ? 'next' : ''}" data-unit="${i}" aria-label="Unit ${u.id}: ${esc(u.title)}">
              <span>${locked ? '🔒' : st ? '✓' : u.letter}</span>
            </button>
            <div class="node-label"><b>Unit ${u.id}</b> ${esc(u.title)}${stars ? `<em>${stars}</em>` : ''}</div>
          </div>`;
      }).join('');
    }
    const learnedWords = Object.keys(S.words).filter((k) => k.startsWith(`g${g}:`)).length;
    const nextUnit = data && (data.units.find((u) => !S.units[unitKey(g, u)]) || data.units[data.units.length - 1]);

    shell('home', `
      <section class="home">
        <header class="topbar">
          <div class="stat streak ${n ? 'on' : ''}" title="Chuỗi ngày học">🔥 <b>${n}</b></div>
          <div class="stat xp" title="Tổng điểm">⭐ <b>${S.xp}</b></div>
          <div class="grade-pill">${info.name}</div>
        </header>
        <div class="home-grid">
          <div class="hero">
            <div class="hero-banner">
              <div class="hero-text"><h1>Chào ${esc(S.profile.name)}!</h1><p>${esc(info.book)}</p></div>
              ${bubble(ms.mood, ms.text, 104)}
            </div>
            ${nextUnit ? `
            <div class="card continue">
              <div class="continue-info">
                <small>Học tiếp</small>
                <h3>Unit ${nextUnit.id} · ${esc(nextUnit.title)}</h3>
                <p>${esc(nextUnit.vi)}</p>
                <div class="continue-pics">${nextUnit.words.map((w) => `<span>${pic(w)}</span>`).join('')}</div>
              </div>
              <button class="btn btn-primary" id="btn-continue" data-unit="${data.units.indexOf(nextUnit)}">Học ngay ▶</button>
            </div>` : ''}
          </div>
          <aside class="side">
            <div class="card streak-card">
              <div class="streak-head">
                <div class="big-flame ${n ? 'on' : ''}">🔥</div>
                <div><b>${n} ngày liên tiếp</b><span>Kỷ lục: ${S.streak.best} ngày</span></div>
              </div>
              <div class="week">${week}</div>
            </div>
            <div class="card">
              <div class="goal-top"><span>🎯 Mục tiêu hôm nay</span><b>${todayXP()}/${S.profile.goal} XP</b></div>
              <div class="bar"><i style="width:${goalPct}%"></i></div>
            </div>
            <div class="quick">
              <div class="quick-stat"><b>${learnedWords}</b><span>từ đã học</span></div>
              <div class="quick-stat"><b>${S.xp}</b><span>tổng XP</span></div>
              <button class="btn btn-accent" id="btn-review" ${learnedWords < 4 ? 'disabled' : ''}>🔁 Ôn từ khó</button>
            </div>
            <button class="card reminder-card" id="btn-reminder">
              <span class="rc-icon">⏰</span>
              <span><b>Nhắc học lúc ${S.profile.reminder}</b><small>Chạm để đổi giờ</small></span>
            </button>
          </aside>
          <div class="path-block">
            <h2 class="section-title">Lộ trình ${info.name}</h2>
            <div class="path">${path}</div>
          </div>
        </div>
      </section>`);

    $('#btn-reminder').onclick = () => { view = 'settings'; render(); };
    const cont = $('#btn-continue');
    if (cont) cont.onclick = () => openUnit(g, data, data.units[+cont.dataset.unit]);
    $('#btn-review').onclick = () => data && startReview(g, data);
    $$('.node').forEach((b) => b.onclick = () => {
      if (b.classList.contains('locked')) { sfx.bad(); return toast('Hoàn thành Unit trước để mở khóa nhé!'); }
      openUnit(g, data, data.units[+b.dataset.unit]);
    });
    checkReminder();
  }

  function openUnit(g, data, u) {
    sfx.tap();
    const words = u.words.map((w) => `<button class="mini-word" data-en="${esc(w.en)}"><span>${pic(w)}</span>${esc(w.en)}</button>`).join('');
    modal(`
      <div class="unit-head"><div class="unit-letter">${u.letter}</div>
        <div><small>Unit ${u.id}</small><h3>${esc(u.title)}</h3><p>${esc(u.vi)}</p></div></div>
      <div class="mini-words">${words}</div>
      ${u.patterns ? `<div class="sentences"><small>Mẫu câu của bài</small>${u.patterns.map((s) => `<button class="sentence" data-s="${esc(s)}">🔈 ${esc(s)}</button>`).join('')}</div>` : ''}
      <div class="row-actions">
        <button class="btn btn-ghost" id="go-speak">🎤 Luyện đọc</button>
        <button class="btn btn-primary" id="go-lesson">Học từ mới ▶</button>
      </div>`, {
      onMount: (m, close) => {
        $$('.mini-word', m).forEach((b) => b.onclick = () => speak(u.words.find((w) => w.en === b.dataset.en)));
        $$('.sentence', m).forEach((b) => b.onclick = () => speak(b.dataset.s.replace(' – ', ' ')));
        $('#go-lesson', m).onclick = () => { close(); startLesson(g, data, u); };
        $('#go-speak', m).onclick = () => { close(); startSpeak(g, data, u); };
      },
    });
  }

  // ---------- Lesson engine ----------
  function makeQuestion(type, w, pool) {
    const others = shuffle(pool.filter((x) => x.en !== w.en && x.emoji !== w.emoji && x.vi !== w.vi));
    const options = shuffle([w, ...others.slice(0, 3)]);
    return { type, word: w, options };
  }
  function buildQuiz(words, pool) {
    const qs = [];
    words.forEach((w) => {
      const types = ['listen', 'pic', 'meaning'];
      if (/^[a-z]{2,7}$/.test(w.en)) types.push('spell');
      shuffle(types).slice(0, 2).forEach((t) => qs.push(makeQuestion(t, w, pool)));
    });
    return shuffle(qs);
  }

  function startLesson(g, data, u) {
    const pool = allWords(g, data);
    const words = pool.filter((w) => w.unit === u);
    L = { kind: 'unit', g, u, words, phase: 'learn', idx: 0, queue: buildQuiz(words, pool), done: 0, mistakes: 0 };
    L.total = L.queue.length;
    view = 'lesson'; render();
  }
  function startReview(g, data) {
    const pool = allWords(g, data);
    const seen = pool.filter((w) => S.words[w.key]);
    const scored = shuffle(seen).sort((a, b) => {
      const sa = S.words[a.key], sb = S.words[b.key];
      return (sb.w * 2 - sb.c) - (sa.w * 2 - sa.c);
    });
    const words = scored.slice(0, 6);
    L = { kind: 'review', g, words, phase: 'quiz', idx: 0, queue: buildQuiz(words, pool), done: 0, mistakes: 0 };
    L.total = L.queue.length;
    view = 'lesson'; render();
  }

  function exitLesson() {
    if (L && L.phase !== 'result') {
      return modal(`${bubble('sad', 'Ơ, bạn muốn dừng à? Tiến độ bài này sẽ không được lưu đâu…', 90)}
        <div class="row-actions"><button class="btn btn-ghost" id="m-quit">Thoát</button>
        <button class="btn btn-primary" id="m-stay">Học tiếp</button></div>`, {
        onMount: (m, close) => {
          $('#m-stay', m).onclick = close;
          $('#m-quit', m).onclick = () => { close(); leaveLesson(); };
        },
      });
    }
    leaveLesson();
  }
  function leaveLesson() {
    stopListening();
    view = L && L.kind === 'speak' ? 'speak' : 'home';
    L = null; render();
  }

  function renderLesson() {
    if (L.phase === 'learn') return renderLearnCard();
    if (L.phase === 'quiz') return renderQuestion();
    if (L.phase === 'speak') return renderSpeak();
    return renderResult();
  }

  function lessonShell(progress, body, footer = '') {
    stopListening();
    app.innerHTML = `
      <section class="screen lesson">
        <header class="lesson-top">
          <button class="icon-btn" id="btn-exit" aria-label="Thoát">✕</button>
          <div class="bar big"><i style="width:${progress}%"></i></div>
        </header>
        <div class="lesson-body">${body}</div>
        <footer class="lesson-foot" id="foot">${footer}</footer>
      </section>`;
    $('#btn-exit').onclick = exitLesson;
  }

  function renderLearnCard() {
    const w = L.words[L.idx];
    const pct = Math.round((L.idx / (L.words.length + L.total)) * 100);
    // Chỉ hiện câu ví dụ có chứa đúng từ đang học
    const hasWord = new RegExp(`\\b${w.en.replace(/[^a-z ]/gi, '')}(s|es)?\\b`, 'i');
    const examples = [...(L.u.patterns || []), ...(L.u.sentences || [])].filter((s) => hasWord.test(s));
    lessonShell(pct, `
      <p class="q-title">Từ mới ${L.idx + 1}/${L.words.length}</p>
      <div class="flash">
        <div class="flash-pic">${pic(w)}</div>
        <div class="flash-word">${esc(w.en)}</div>
        <div class="flash-vi">${esc(w.vi)}</div>
        <button class="sound-btn" id="say" aria-label="Nghe">🔊</button>
      </div>
      ${examples.length ? `<div class="sentences"><small>Câu trong sách</small>${examples.map((s) => `<button class="sentence" data-s="${esc(s)}">🔈 ${esc(s)}</button>`).join('')}</div>` : ''}`,
      `<button class="btn btn-primary btn-block" id="next">${L.idx === L.words.length - 1 ? 'Làm bài tập ▶' : 'Tiếp theo'}</button>`);
    $('#say').onclick = () => speak(w);
    $$('.sentence').forEach((b) => b.onclick = () => speak(b.dataset.s));
    setTimeout(() => speak(w), 250);
    $('#next').onclick = () => {
      sfx.tap();
      if (L.idx < L.words.length - 1) L.idx++;
      else { L.phase = 'quiz'; L.idx = 0; }
      renderLesson();
    };
  }

  function renderQuestion() {
    const q = L.queue[0];
    const w = q.word;
    const base = L.kind === 'unit' ? L.words.length : 0;
    const pct = Math.round(((base + L.done) / (base + L.total)) * 100);
    let body = '';
    if (q.type === 'listen') {
      body = `<p class="q-title">Nghe và chọn hình đúng</p>
        <button class="sound-btn huge" id="say" aria-label="Nghe lại">🔊</button>
        <div class="opts pics">${q.options.map((o, i) => `<button class="opt pic" data-i="${i}">${pic(o)}</button>`).join('')}</div>`;
    } else if (q.type === 'pic') {
      body = `<p class="q-title">Đây là gì?</p>
        <div class="q-pic">${pic(w)}</div>
        <div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.en)}</button>`).join('')}</div>`;
    } else if (q.type === 'meaning') {
      body = `<p class="q-title">Chọn nghĩa đúng</p>
        <div class="q-word"><button class="sound-btn" id="say" aria-label="Nghe">🔊</button>${esc(w.en)}</div>
        <div class="opts">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.vi)}</button>`).join('')}</div>`;
    } else {
      q.letters = q.letters || shuffle(w.en.split('').map((ch, i) => ({ ch, i })));
      q.answer = [];
      body = `<p class="q-title">Xếp chữ thành từ đúng</p>
        <div class="q-pic small">${pic(w)}</div>
        <div class="q-hint">${esc(w.vi)}</div>
        <div class="slots">${w.en.split('').map((_, i) => `<span class="slot" data-s="${i}"></span>`).join('')}</div>
        <div class="tiles">${q.letters.map((t, i) => `<button class="tile" data-t="${i}">${t.ch}</button>`).join('')}</div>`;
    }
    lessonShell(pct, body);
    const say = $('#say'); if (say) say.onclick = () => speak(w);
    if (q.type === 'listen' || q.type === 'meaning') setTimeout(() => speak(w), 250);

    if (q.type === 'spell') {
      const slots = $$('.slot'), tiles = $$('.tile');
      const paint = () => slots.forEach((s, i) => { s.textContent = q.answer[i] != null ? q.letters[q.answer[i]].ch : ''; s.classList.toggle('filled', q.answer[i] != null); });
      tiles.forEach((t) => t.onclick = () => {
        if (t.disabled) return;
        sfx.tap(); q.answer.push(+t.dataset.t); t.disabled = true; paint();
        if (q.answer.length === w.en.length) {
          const typed = q.answer.map((i) => q.letters[i].ch).join('');
          answer(typed === w.en, `<b>${esc(w.en)}</b>`);
        }
      });
      slots.forEach((s) => s.onclick = () => {
        if (s.closest('.locked')) return;
        const i = +s.dataset.s; if (q.answer[i] == null) return;
        const removed = q.answer.splice(i);
        removed.forEach((ti) => { tiles[ti].disabled = false; });
        paint();
      });
      return;
    }
    $$('.opt').forEach((b) => b.onclick = () => {
      if ($('.opts').classList.contains('locked')) return;
      const chosen = q.options[+b.dataset.i];
      const ok = chosen.en === w.en;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) $$('.opt').forEach((x) => { if (q.options[+x.dataset.i].en === w.en) x.classList.add('right'); });
      const correct = q.type === 'listen' ? `${pic(w)} <b>${esc(w.en)}</b>` : q.type === 'meaning' ? `<b>${esc(w.vi)}</b>` : `<b>${esc(w.en)}</b>`;
      answer(ok, correct);
    });
  }

  function answer(ok, correctHtml) {
    const q = L.queue[0], w = q.word;
    $$('.opts, .tiles, .slots').forEach((x) => x.classList.add('locked'));
    const st = S.words[w.key] || (S.words[w.key] = { c: 0, w: 0 });
    if (ok) { st.c++; sfx.good(); setTimeout(() => speak(w), 350); }
    else { st.w++; L.mistakes++; sfx.bad(); }
    save();
    const praise = pick(['Tuyệt vời!', 'Giỏi quá!', 'Chính xác!', 'Siêu ghê!', 'Đúng rồi!']);
    const foot = $('#foot');
    foot.className = `lesson-foot ${ok ? 'ok' : 'no'}`;
    foot.innerHTML = `
      <div class="feedback">
        <div class="fb-mascot">${mascotSVG(ok ? 'cheer' : 'sad', 58)}</div>
        <div><b>${ok ? praise : 'Chưa đúng rồi!'}</b>${ok ? '' : `<p>Đáp án: ${correctHtml}</p>`}</div>
      </div>
      <button class="btn ${ok ? 'btn-success' : 'btn-danger'} btn-block" id="cont">Tiếp tục</button>`;
    $('#cont').onclick = () => {
      L.queue.shift();
      if (ok) L.done++;
      else L.queue.push({ ...q, options: shuffle(q.options), letters: null }); // làm lại câu sai ở cuối
      if (!L.queue.length) { L.phase = 'result'; finishLesson(); }
      renderLesson();
    };
  }

  function finishLesson() {
    if (L.kind === 'speak') L.mistakes = L.items.filter((it) => (it.best || 0) < PASS).length;
    let xp = L.kind === 'unit' ? LESSON_XP : L.kind === 'speak' ? SPEAK_XP : REVIEW_XP;
    if (L.mistakes === 0) xp += PERFECT_BONUS;
    const stars = L.mistakes === 0 ? 3 : L.mistakes <= 2 ? 2 : 1;
    if (L.kind === 'unit' || L.kind === 'speak') {
      const bucket = L.kind === 'unit' ? S.units : S.speak;
      const k = unitKey(L.g, L.u);
      bucket[k] = { stars: Math.max(stars, (bucket[k] || {}).stars || 0) };
    }
    const hadGoal = todayXP() >= S.profile.goal;
    L.result = { xp, stars, extended: recordXP(xp), goalReached: !hadGoal && todayXP() >= S.profile.goal };
  }

  function renderResult() {
    const r = L.result;
    const n = currentStreak();
    const lines = [`<div class="res-stat"><span>⭐</span><b>+${r.xp} XP</b></div>`];
    if (L.kind !== 'review') lines.unshift(`<div class="res-stars">${[0, 1, 2].map((i) => `<i class="${i < r.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</i>`).join('')}</div>`);
    app.innerHTML = `
      <section class="screen result">
        <div class="res-mascot">${mascotSVG('cheer', 150)}</div>
        <h1>${L.kind === 'unit' ? `Hoàn thành Unit ${L.u.id}!` : L.kind === 'speak' ? `Luyện đọc Unit ${L.u.id} xong!` : 'Ôn tập xong rồi!'}</h1>
        ${L.kind === 'speak' ? `<p class="res-note">Đọc chuẩn ${L.items.length - L.mistakes}/${L.items.length} lượt 🎤</p>` : ''}
        ${lines.join('')}
        ${r.extended ? `<div class="streak-burst"><div class="flame">🔥</div><div><b>${n} ngày liên tiếp!</b><p>${n === 1 ? 'Chuỗi mới bắt đầu rồi. Mai quay lại nhé!' : 'Chuỗi của bạn tăng lên rồi!'}</p></div></div>` : ''}
        ${r.goalReached ? '<div class="goal-done">🎯 Đạt mục tiêu hôm nay!</div>' : ''}
        <button class="btn btn-primary btn-block" id="home">Về trang chủ</button>
      </section>`;
    sfx.win(); confetti();
    $('#home').onclick = () => leaveLesson();
  }

  // ---------- Luyện đọc (nhận giọng nói) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  let rec = null, media = null, recTimer = null;

  function stopListening() {
    clearTimeout(recTimer);
    if (rec) { const r = rec; rec = null; try { r.abort(); } catch (e) {} }
    if (media) {
      const m = media; media = null; m.cancelled = true;
      try { if (m.recorder.state !== 'inactive') m.recorder.stop(); } catch (e) {}
      m.stream.getTracks().forEach((t) => t.stop());
    }
  }

  // Từ nghe giống nhau mà máy hay nhận nhầm
  const HOMOPHONES = { red: ['read'], sun: ['son'], hair: ['hare'], two: ['to', 'too'], four: ['for'], see: ['sea'], bye: ['by', 'buy'], i: ['eye'] };
  const NUMBERS = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };
  const normText = (s) => s.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const heardTokens = (s) => normText(s).split(' ').filter(Boolean).map((t) => NUMBERS[t] || t);
  function lev(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  function tokenSim(t, h) {
    if (t === h || (HOMOPHONES[t] || []).includes(h)) return 1;
    const a = t.replace(/'/g, ''), b = h.replace(/'/g, '');
    return a === b ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length, 1);
  }
  // Từ phụ: tính nhẹ hơn khi chấm điểm, và được phép đọc sai
  const FILLERS = new Set(['a', 'an', 'the', 'and', 'is', 'are', 'to', 'at', 'of', 'in', 'on', 'my', 'your']);
  // Mỗi từ trong câu mẫu được so với từ giống nhất bé đã nói; lấy kết quả tốt nhất trong các phương án máy nghe được.
  // Đạt khi mọi từ chính đều đúng và điểm trung bình (từ chính hệ số 2) ≥ PASS.
  function scoreSpeech(targetTokens, alts) {
    const weights = targetTokens.map((t) => FILLERS.has(t) && targetTokens.length > 1 ? 1 : 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let best = { score: 0, pass: false, marks: targetTokens.map(() => false), heard: alts[0] || '' };
    alts.forEach((alt) => {
      const ht = heardTokens(alt);
      if (!ht.length) return;
      let sims = targetTokens.map((t) => Math.max(...ht.map((h) => tokenSim(t, h))));
      if (targetTokens.length === 2) { // "teddy bear" có thể bị nghe thành "teddybear"
        const joined = Math.max(...ht.map((h) => tokenSim(targetTokens.join(''), h)));
        sims = sims.map((s) => Math.max(s, joined));
      }
      const score = sims.reduce((a, s, i) => a + s * weights[i], 0) / total;
      const marks = sims.map((s) => s >= PASS);
      const pass = score >= PASS && marks.every((ok, i) => ok || weights[i] === 1);
      if (pass > best.pass || (pass === best.pass && score > best.score)) best = { score, pass, marks, heard: alt };
    });
    return best;
  }

  function startSpeak(g, data, u) {
    const sentences = [...(u.patterns || []), ...(u.sentences || [])]
      .map((s) => s.replace(/\s+–\s+/g, ' '))
      .filter((s, i, a) => a.indexOf(s) === i).slice(0, 4);
    const items = [
      ...u.words.map((w) => ({ type: 'word', text: w.en, word: w })),
      ...sentences.map((s) => ({ type: 'sentence', text: s })),
    ];
    L = { kind: 'speak', g, u, items, idx: 0, phase: 'speak', mistakes: 0, total: items.length };
    view = 'lesson'; render();
  }

  const speakMode = () => SR ? 'sr' : canRecord ? 'rec' : 'self';
  const skipFoot = '<button class="btn btn-link skip" id="skip">Bỏ qua</button>';

  function renderSpeak() {
    const it = L.items[L.idx];
    it.tries = it.tries || 0;
    it.parts = it.text.split(/\s+/).filter((p) => normText(p));
    it.tokens = it.parts.map(normText);
    const pct = Math.round((L.idx / L.items.length) * 100);
    lessonShell(pct, `
      <p class="q-title">${it.type === 'word' ? 'Đọc to từ này' : 'Đọc to câu này'}</p>
      <div class="speak-card">
        ${it.word ? `<div class="q-pic small">${pic(it.word)}</div>` : `<div class="speak-mascot">${mascotSVG('think', 76)}</div>`}
        <div class="speak-target ${it.type}" id="target">${it.parts.map((p) => `<span>${esc(p)}</span>`).join(' ')}</div>
        ${it.word ? `<div class="q-hint">${esc(it.word.vi)}</div>` : ''}
        <div class="speak-listen">
          <button class="btn btn-ghost" id="say">🔊 Nghe mẫu</button>
          <button class="btn btn-ghost" id="slow">🐢 Đọc chậm</button>
        </div>
      </div>
      <button class="mic-btn" id="mic" aria-label="Bấm để đọc"><span>🎤</span></button>
      <p class="mic-status" id="mic-status">${speakMode() === 'self' ? 'Đọc to theo mẫu rồi bấm mic để tự đánh giá nhé!' : 'Nghe mẫu, rồi chạm mic và đọc to nhé!'}</p>
      <p class="heard" id="heard"></p>`, skipFoot);
    $('#say').onclick = () => speak(it.text);
    $('#slow').onclick = () => speak(it.text, 0.5);
    setTimeout(() => speak(it.text), 300);
    bindSpeakFoot(it);
    $('#mic').onclick = () => {
      const mode = speakMode();
      if (mode === 'sr') return rec ? rec.stop() : listenSR(it);
      if (mode === 'rec') return media ? media.recorder.stop() : recordSelf(it);
      showSelfCheck(it);
    };
  }
  function bindSpeakFoot(it) {
    const foot = $('#foot');
    foot.className = 'lesson-foot';
    foot.innerHTML = skipFoot;
    $('#skip').onclick = nextSpeak;
  }
  function nextSpeak() {
    stopListening();
    L.idx++;
    if (L.idx >= L.items.length) { L.phase = 'result'; finishLesson(); }
    renderLesson();
  }

  function listenSR(it) {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const mic = $('#mic'), status = $('#mic-status'), heard = $('#heard');
    const r = new SR();
    rec = r;
    r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
    let alts = [], error = null;
    $$('#target span').forEach((s) => { s.className = ''; });
    r.onstart = () => { mic.classList.add('listening'); status.textContent = 'Chíp đang nghe… đọc to nhé!'; heard.textContent = ''; };
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      alts = [...res].map((a) => a.transcript);
      heard.textContent = `“${alts[0].trim()}”`;
    };
    r.onerror = (e) => { error = e.error; };
    r.onend = () => {
      clearTimeout(recTimer);
      mic.classList.remove('listening');
      if (rec !== r) return; // đã bị huỷ (thoát bài, sang câu khác)
      rec = null;
      if (error === 'not-allowed' || error === 'service-not-allowed') { status.textContent = '🚫 Bạn cần cho phép dùng micro (bấm biểu tượng ổ khóa cạnh thanh địa chỉ).'; return; }
      if (error === 'network') { status.textContent = '📶 Chấm điểm giọng nói cần có mạng Internet. Kiểm tra mạng rồi thử lại nhé!'; return; }
      if (!alts.length) { status.textContent = 'Chíp chưa nghe thấy gì. Chạm mic và đọc to hơn nhé!'; return; }
      status.textContent = '';
      judgeSpeak(it, scoreSpeech(it.tokens, alts));
    };
    try { r.start(); } catch (e) { rec = null; return; }
    recTimer = setTimeout(() => { try { r.stop(); } catch (e) {} }, it.type === 'word' ? 5000 : 8000);
  }

  function judgeSpeak(it, res) {
    it.tries++;
    const ok = res.pass, near = !ok && res.score >= 0.5, done = ok || it.tries >= 3;
    it.best = Math.max(it.best || 0, ok ? 1 : Math.min(res.score, PASS - 0.01));
    $$('#target span').forEach((s, i) => { s.className = res.marks[i] ? 'ok' : 'no'; });
    $('#heard').innerHTML = `Chíp nghe thấy: <b>“${esc(res.heard.trim())}”</b>`;
    ok ? sfx.good() : sfx.bad();
    const foot = $('#foot');
    foot.className = `lesson-foot ${ok ? 'ok' : 'no'}`;
    foot.innerHTML = `
      <div class="feedback">
        <div class="fb-mascot">${mascotSVG(ok ? 'cheer' : 'sad', 58)}</div>
        <div><b>${ok ? pick(['Đọc chuẩn quá!', 'Tuyệt vời!', 'Giỏi ghê!']) : near ? 'Gần đúng rồi!' : 'Chưa đúng rồi!'}</b>
          <p>${ok ? `Điểm đọc: ${Math.round(res.score * 100)}/100` : done ? 'Không sao, mình sang câu tiếp nhé!' : `Nghe mẫu rồi đọc lại nhé! (lần ${it.tries}/3)`}</p></div>
      </div>
      ${done
        ? `<button class="btn ${ok ? 'btn-success' : 'btn-danger'} btn-block" id="cont">Tiếp tục</button>`
        : `<div class="row-actions"><button class="btn btn-ghost" id="skip2">Bỏ qua</button><button class="btn btn-danger" id="retry">🎤 Đọc lại</button></div>`}`;
    if (done) { $('#cont').onclick = nextSpeak; return; }
    $('#skip2').onclick = nextSpeak;
    $('#retry').onclick = () => { bindSpeakFoot(it); listenSR(it); };
  }

  // Dự phòng khi trình duyệt không nhận được giọng nói: ghi âm, nghe lại và tự đánh giá
  async function recordSelf(it) {
    const mic = $('#mic'), status = $('#mic-status');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream), chunks = [];
      const m = media = { stream, recorder, cancelled: false };
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        clearTimeout(recTimer);
        stream.getTracks().forEach((t) => t.stop());
        mic.classList.remove('listening');
        if (m.cancelled) return;
        media = null;
        status.textContent = '';
        showSelfCheck(it, URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
      };
      recorder.start();
      mic.classList.add('listening');
      status.textContent = 'Đang ghi âm… đọc xong chạm mic lần nữa';
      recTimer = setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 7000);
    } catch (e) {
      status.textContent = '🚫 Bạn cần cho phép dùng micro.';
    }
  }
  function showSelfCheck(it, url) {
    const foot = $('#foot');
    foot.className = 'lesson-foot stack';
    foot.innerHTML = `
      ${url ? '<button class="btn btn-ghost btn-block" id="playback">▶️ Nghe lại giọng của bạn</button>' : ''}
      <p class="hint center">Bạn đọc giống mẫu chưa?</p>
      <div class="row-actions"><button class="btn btn-ghost" id="again">🔁 Đọc lại</button><button class="btn btn-success" id="good">👍 Giống rồi!</button></div>`;
    if (url) { const a = new Audio(url); a.play().catch(() => {}); $('#playback').onclick = () => a.play(); }
    $('#again').onclick = () => bindSpeakFoot(it);
    $('#good').onclick = () => { it.best = 1; sfx.good(); nextSpeak(); };
  }

  async function renderSpeakHome() {
    const g = S.profile.grade, data = await loadGrade(g), info = gradeInfo(g);
    let prevDone = true;
    const cards = data ? data.units.map((u, i) => {
      const learned = S.units[unitKey(g, u)];
      const locked = !S.profile.unlockAll && !prevDone;
      prevDone = !!learned;
      const st = S.speak[unitKey(g, u)];
      return `
        <button class="speak-unit ${locked ? 'locked' : ''}" data-unit="${i}">
          <span class="su-letter">${locked ? '🔒' : u.letter}</span>
          <span class="su-info"><b>Unit ${u.id}</b><small>${esc(u.title)}</small>
            <em>${st ? '★'.repeat(st.stars) + '☆'.repeat(3 - st.stars) : u.words.map((w) => pic(w)).join(' ')}</em></span>
          <span class="su-mic">🎤</span>
        </button>`;
    }).join('') : '<p class="empty">Chưa có dữ liệu cho lớp này.</p>';
    const warn = SR ? '' : `<div class="card warn">${canRecord
      ? '⚠️ Trình duyệt này chưa chấm điểm được giọng nói. Bạn vẫn luyện được: ghi âm, nghe lại và tự so với mẫu. Dùng <b>Chrome</b>, <b>Edge</b> hoặc <b>Safari</b> để được Chíp chấm điểm.'
      : '⚠️ Trình duyệt này không dùng được micro. Hãy mở app bằng <b>Chrome</b>, <b>Edge</b> hoặc <b>Safari</b>.'}</div>`;
    shell('speak', `
      <section class="home speak-home">
        <div class="hero-banner">
          <div class="hero-text"><h1>Luyện đọc</h1><p>${esc(info.name)} · Đọc to theo Chíp</p></div>
          ${bubble('happy', 'Nghe mẫu 🔊, chạm mic 🎤 rồi đọc to. Chíp sẽ chấm điểm cho bạn!', 96)}
        </div>
        ${warn}
        <div class="speak-grid">${cards}</div>
      </section>`);
    $$('.speak-unit').forEach((b) => b.onclick = () => {
      if (b.classList.contains('locked')) { sfx.bad(); return toast('Học từ mới của Unit trước để mở khóa nhé!'); }
      startSpeak(g, data, data.units[+b.dataset.unit]);
    });
  }

  // ---------- Settings ----------
  function renderSettings() {
    const p = S.profile;
    const gradeOpts = window.GRADES.map((g) => `<option value="${g.id}" ${g.id === p.grade ? 'selected' : ''} ${g.src ? '' : 'disabled'}>${g.name}${g.src ? '' : ' (sắp có)'}</option>`).join('');
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    shell('settings', `
      <section class="settings">
        <header class="lesson-top"><button class="icon-btn back-btn" id="back" aria-label="Quay lại">←</button><h2>Cài đặt</h2></header>
        <div class="settings-grid">
        <div class="card">
          <label class="field"><span>Tên</span><input id="s-name" maxlength="20" value="${esc(p.name)}"></label>
          <label class="field"><span>Lớp</span><select id="s-grade">${gradeOpts}</select></label>
          <label class="field"><span>Mục tiêu mỗi ngày</span><select id="s-goal">${GOALS.map((g) => `<option value="${g.xp}" ${g.xp === p.goal ? 'selected' : ''}>${g.label} – ${g.sub}</option>`).join('')}</select></label>
          <label class="check"><input type="checkbox" id="s-unlock" ${p.unlockAll ? 'checked' : ''}> Mở khóa tất cả Unit</label>
        </div>
        <div class="card">
          <h3>⏰ Nhắc học mỗi ngày</h3>
          <label class="field"><span>Giờ nhắc</span><input id="s-time" type="time" value="${p.reminder}"></label>
          <button class="btn btn-ghost btn-block" id="s-notify" ${perm === 'granted' || perm === 'unsupported' ? 'disabled' : ''}>
            ${perm === 'granted' ? '✅ Đã bật thông báo' : perm === 'unsupported' ? 'Trình duyệt không hỗ trợ thông báo' : perm === 'denied' ? '🚫 Thông báo đang bị chặn' : '🔔 Bật thông báo'}</button>
          <button class="btn btn-ghost btn-block" id="s-ics">📅 Thêm nhắc nhở vào lịch điện thoại</button>
          <p class="hint">Thông báo hiện khi app đang mở hoặc chạy nền. Để chắc chắn được nhắc cả khi đóng app, hãy thêm nhắc nhở vào lịch điện thoại (lặp lại hằng ngày).</p>
          <button class="btn btn-ghost btn-block" id="s-test">Thử lời nhắc của Chíp</button>
        </div>
        </div>
        <div class="settings-actions">
          <button class="btn btn-primary btn-block" id="s-save">Lưu</button>
          <button class="btn btn-link" id="s-reset">Xóa toàn bộ tiến độ</button>
        </div>
      </section>`);
    $('#back').onclick = () => { view = 'home'; render(); };
    $('#s-notify').onclick = async () => {
      const r = await Notification.requestPermission();
      toast(r === 'granted' ? 'Đã bật thông báo!' : 'Bạn chưa cho phép thông báo');
      renderSettings();
    };
    $('#s-ics').onclick = () => downloadICS($('#s-time').value || p.reminder);
    $('#s-test').onclick = () => showReminder(true);
    $('#s-save').onclick = () => {
      const name = $('#s-name').value.trim();
      if (!name) return toast('Tên không được để trống');
      const newTime = $('#s-time').value || p.reminder;
      if (newTime !== p.reminder) S.remindedOn = null;
      Object.assign(p, { name, grade: +$('#s-grade').value, goal: +$('#s-goal').value, reminder: newTime, unlockAll: $('#s-unlock').checked });
      save(); toast('Đã lưu!'); view = 'home'; render();
    };
    $('#s-reset').onclick = () => modal(`${bubble('sad', 'Xóa hết tiến độ, chuỗi ngày và điểm? Không thể hoàn tác đâu!', 90)}
      <div class="row-actions"><button class="btn btn-ghost" id="m-no">Không</button><button class="btn btn-danger" id="m-yes">Xóa</button></div>`, {
      onMount: (m, close) => {
        $('#m-no', m).onclick = close;
        $('#m-yes', m).onclick = () => { close(); S = defaultState(); save(); view = 'home'; render(); };
      },
    });
  }

  function downloadICS(time) {
    const [h, m] = time.split(':');
    const d = new Date(); d.setDate(d.getDate() + (reminderPassed() ? 1 : 0));
    const start = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${h}${m}00`;
    const url = location.href.split('#')[0];
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chip English//VI', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:chip-english-daily-${Date.now()}@chip-english`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${start}`, 'DURATION:PT15M', 'RRULE:FREQ=DAILY',
      'SUMMARY:🐥 Học từ vựng tiếng Anh với Chíp',
      `DESCRIPTION:Giữ chuỗi 🔥 nào! Mở app: ${url}`,
      `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Đến giờ học từ vựng rồi!', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'nhac-hoc-chip-english.ics';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Mở file vừa tải để thêm vào lịch nhé!');
  }

  // ---------- Reminders ----------
  async function notify(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      const opts = { body, icon: 'icons/icon.svg', badge: 'icons/icon.svg', tag: 'daily-reminder', renotify: true };
      if (reg) reg.showNotification(title, opts); else new Notification(title, opts);
    } catch (e) {}
  }
  function showReminder(test = false) {
    const n = currentStreak();
    const name = esc(S.profile.name);
    const text = n > 0 ? `${name} ơi, đến giờ học rồi! Học ngay để giữ chuỗi <b>${n} ngày</b> 🔥 nhé!` : `${name} ơi, đến giờ học rồi! Học với Chíp 5 phút thôi!`;
    if (!test) notify('🐥 Chíp nhắc bạn học bài!', text.replace(/<[^>]+>/g, ''));
    if (view === 'lesson') return;
    modal(`<div class="reminder">${mascotSVG('sad', 130)}<p>${text}</p></div>
      <div class="row-actions"><button class="btn btn-ghost" id="m-later">Để sau</button><button class="btn btn-primary" id="m-go">Học ngay!</button></div>`, {
      onMount: (m, close) => {
        $('#m-later', m).onclick = close;
        $('#m-go', m).onclick = async () => {
          close();
          const g = S.profile.grade, data = await loadGrade(g);
          if (!data) return;
          const next = data.units.find((u) => !S.units[unitKey(g, u)]) || pick(data.units);
          startLesson(g, data, next);
        };
      },
    });
  }
  function checkReminder() {
    if (!S.profile || studiedToday() || S.remindedOn === today() || !reminderPassed()) return;
    S.remindedOn = today(); save();
    showReminder();
  }
  setInterval(checkReminder, 30 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && view === 'home') render();
  });

  // ---------- Boot ----------
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  render();
})();
