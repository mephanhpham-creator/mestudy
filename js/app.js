(() => {
  'use strict';

  const STORE_KEY = 'chip-english.v1';
  const LESSON_XP = 15, PERFECT_BONUS = 5, REVIEW_XP = 10, SPEAK_XP = 15;
  const PASS = 0.75;          // điểm đọc tối thiểu để tính là đọc đúng (0–1)
  const GOALS = [
    { xp: 15, lessons: 1, label: 'Nhẹ nhàng', sub: '1 bài/ngày', icon: '🌱', tone: 'mint' },
    { xp: 30, lessons: 2, label: 'Chăm chỉ', sub: '2 bài/ngày', icon: '📅', tone: 'peach' },
    { xp: 45, lessons: 3, label: 'Siêu sao', sub: '3 bài/ngày', icon: '⭐', tone: 'pink' },
  ];
  const BADGES = [
    { days: 3, icon: '🔥', tone: 'fire' },
    { days: 7, icon: '⭐', tone: 'star' },
    { days: 30, icon: '📖', tone: 'book' },
    { days: 100, icon: '👑', tone: 'crown' },
  ];
  const TONES = ['pink', 'orange', 'blue', 'green', 'purple'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // Ảnh minh họa của từ: dùng `img` nếu có, không thì dùng emoji
  const ipaHtml = (w) => w.ipa ? `<div class="flash-ipa">/${esc(w.ipa)}/</div>` : '';
  const POS_VI = { n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ', phr: 'cụm từ' };
  const posHtml = (w) => w.pos ? `<span class="pos" title="${w.pos.split(/,\s*/).map((p) => POS_VI[p] || p).join(', ')}">${esc(w.pos)}</span>` : '';
  const pic = (w) => w.img ? `<img class="word-img" src="${esc(w.img)}" alt="" onerror="this.replaceWith(document.createTextNode('${w.emoji}'))">` : w.emoji;

  // ---------- Icons (nét tròn, đổi màu theo currentColor) ----------
  const svg = (d) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    home: svg('<path d="M3.5 11 12 4l8.5 7v8.5c0 .8-.7 1.5-1.5 1.5h-4v-6h-6v6H5c-.8 0-1.5-.7-1.5-1.5z"/>'),
    book: svg('<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13M6.5 9h2.5M6.5 12h2.5M15 9h2.5M15 12h2.5"/>'),
    review: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v4.5h4.5"/>'),
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.6-2-3.4-2.4.9a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.4A7.6 7.6 0 0 0 7 6.4l-2.4-.9-2 3.4 2 1.6a7.7 7.7 0 0 0 0 3l-2 1.6 2 3.4 2.4-.9a7.6 7.6 0 0 0 2.6 1.5l.4 2.4h4l.4-2.4a7.6 7.6 0 0 0 2.6-1.5l2.4.9 2-3.4z"/>'),
    gift: svg('<rect x="3.5" y="8" width="17" height="4.5" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8v12M12 8S10.5 3.5 8 4.2 8.5 8 12 8zm0 0s1.5-4.5 4-3.8S15.5 8 12 8z"/>'),
    back: svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
    close: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
    chev: svg('<path d="M9.5 5.5 16 12l-6.5 6.5"/>'),
    sound: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.5a7.5 7.5 0 0 1 0 11"/>'),
    play: svg('<path d="M8.5 5.5v13l10.5-6.5z" fill="currentColor"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    bell: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" fill="currentColor"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    cal: svg('<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
    target: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
    trash: svg('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    unlock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7"/>'),
    user: svg('<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>'),
    spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>'),
  };

  // ---------- State ----------
  const defaultState = () => ({
    profile: null,            // { name, grade, reminder:'19:00', goal:15, unlockAll:false }
    streak: { count: 0, best: 0, last: null },
    days: {},                 // 'YYYY-MM-DD' -> xp
    lessons: {},              // 'YYYY-MM-DD' -> số bài đã học
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
  const goalInfo = () => GOALS.find((g) => g.xp === S.profile.goal) || GOALS[0];
  const lessonsToday = () => (S.lessons || {})[today()] || 0;
  const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  // 7 ngày của tuần hiện tại, bắt đầu từ thứ Hai
  function thisWeek() {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return [...Array(7)].map((_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return { key: keyOf(x), label: WEEKDAYS[x.getDay()] }; });
  }

  function recordXP(xp) {
    const t = today();
    S.xp += xp;
    S.days[t] = (S.days[t] || 0) + xp;
    S.lessons = S.lessons || {};
    S.lessons[t] = (S.lessons[t] || 0) + 1;
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
    if (window.GRADE_DATA[id]) return Promise.resolve(prepareGrade(window.GRADE_DATA[id]));
    const info = gradeInfo(id);
    if (!info || !info.src) return Promise.resolve(null);
    return new Promise((res) => {
      const s = document.createElement('script');
      s.src = info.src;
      s.onload = () => res(prepareGrade(window.GRADE_DATA[id]));
      s.onerror = () => res(null);
      document.head.appendChild(s);
    });
  }
  // Chuẩn hóa dữ liệu 1 lần: chia Unit dài thành các phần ~7 từ; từ không có hình dùng icon của Unit
  const PART_SIZE = 7;
  function prepareGrade(data) {
    if (!data || data.prepared) return data;
    data.units.forEach((u) => {
      u.badge = u.letter || u.badgeText || String(u.id);
      u.words.forEach((w) => { if (!w.emoji) { w.emoji = u.icon || '📘'; w.noPic = true; } });
      // Unit tới 9 từ học trong 1 bài; dài hơn thì chia phần ~7 từ
      const n = u.words.length <= 9 ? 1 : Math.ceil(u.words.length / PART_SIZE), size = Math.ceil(u.words.length / n);
      u.parts = [...Array(n)].map((_, i) => u.words.slice(i * size, (i + 1) * size));
    });
    data.prepared = true;
    return data;
  }
  // Tên hiển thị của Unit ("Unit 3"), hoặc tên riêng như "Starter"
  const uname = (u) => u.name || `Unit ${u.id}`;
  const unitKey = (g, u) => `g${g}:u${u.id}`;
  // Unit 1 phần giữ khóa cũ (tương thích tiến độ đã lưu của lớp 1)
  const partKey = (g, u, p) => (u.parts.length === 1 ? unitKey(g, u) : `${unitKey(g, u)}:p${p + 1}`);
  const wordKey = (g, u, w) => `g${g}:u${u.id}:${w.en}`;
  function allWords(g, data) {
    return data.units.flatMap((u) => u.words.map((w) => ({ ...w, key: wordKey(g, u, w), unit: u })));
  }
  const learnedCount = (g) => Object.keys(S.words).filter((k) => k.startsWith(`g${g}:`)).length;
  // Tiến độ một Unit (học từ hoặc luyện đọc): số phần đã xong, sao = sao thấp nhất trong các phần
  function unitProgress(g, u, bucket = S.units) {
    const st = u.parts.map((_, p) => bucket[partKey(g, u, p)]);
    const doneParts = st.filter(Boolean).length;
    return { doneParts, total: u.parts.length, done: doneParts === u.parts.length, stars: doneParts === u.parts.length ? Math.min(...st.map((x) => x.stars)) : 0 };
  }
  const nextPartOf = (g, u, bucket = S.units) => Math.max(0, u.parts.findIndex((_, p) => !bucket[partKey(g, u, p)]));
  // Trạng thái từng Unit: đã xong / đang học / khóa
  function unitStates(g, data) {
    let prevDone = true;
    return data.units.map((u) => {
      const pr = unitProgress(g, u);
      const locked = !S.profile.unlockAll && !prevDone;
      prevDone = pr.done;
      return { u, stars: pr.stars, done: pr.done, doneParts: pr.doneParts, total: pr.total, locked, next: false };
    }).map((x, i, arr) => ({ ...x, next: !x.locked && !x.done && arr.findIndex((y) => !y.locked && !y.done) === i }));
  }
  // Nhận ra từ trong câu, kể cả dạng -s/-es/-d/-ed/-ing (provide → provided, perform → performing)
  function wordRe(en) {
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const words = en.toLowerCase().trim().split(/\s+/), last = words.pop();
    const stems = [last];
    if (last.endsWith('e')) stems.push(last.slice(0, -1));
    if (last.endsWith('y')) stems.push(last.slice(0, -1) + 'i');
    const head = words.map(esc).join('[\\s-]+');
    return new RegExp(`\\b${head ? head + '[\\s-]+' : ''}(?:${stems.map(esc).join('|')})(?:s|es|d|ed|ing)?\\b`, 'i');
  }
  const nextUnitOf = (g, data) => data.units.find((u) => !unitProgress(g, u).done) || data.units[data.units.length - 1];

  // ---------- Audio ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /google|samantha|aria|jenny|zira/i.test(v.name))
      || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  // Phát âm bằng giọng máy Anh–Mỹ (en-US); nếu từ có trường `audio` thì phát file ghi âm đó
  let player = null;
  function stopSpeaking() {
    if (player) { player.pause(); player = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
  function playFile(src, rate, fallback) {
    stopSpeaking();
    const a = new Audio(src);
    player = a;
    a.playbackRate = rate < 0.7 ? 0.7 : 1;       // "Đọc chậm": chậm lại nhưng giữ cao độ giọng
    a.preservesPitch = true; a.webkitPreservesPitch = true;
    a.play().catch(() => { if (player === a && fallback) fallback(); });
    a.onerror = () => { if (player === a && fallback) fallback(); };
  }
  function speak(word, rate = 0.8) {
    if (word && word.audio) return playFile(word.audio, rate, () => ttsSpeak(word.en, rate));
    ttsSpeak(typeof word === 'string' ? word : word.en, rate);
  }
  function ttsSpeak(text, rate = 0.8) {
    if (!('speechSynthesis' in window)) return;
    stopSpeaking();
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
  function modal(html, { onMount, cls = '' } = {}) {
    const root = $('#modal-root');
    root.innerHTML = `<div class="modal-backdrop"><div class="modal ${cls}"><div class="sheet-handle"></div>${html}</div></div>`;
    const close = () => { root.innerHTML = ''; };
    root.querySelector('.modal-backdrop').addEventListener('click', (e) => { if (e.target.classList.contains('modal-backdrop')) close(); });
    onMount && onMount(root.querySelector('.modal'), close);
    return close;
  }
  function confetti() {
    const colors = ['#8B6CFF', '#FFC93C', '#22C55E', '#FF5FA2', '#4DA3FF', '#FF8A4C'];
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
  const starsHtml = (n, cls = '') => `<span class="stars ${cls}">${[0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
  const toggle = (id, on) => `<label class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span></span></label>`;
  function segBar(i, n) {
    if (n > 12) return `<div class="seg-wrap"><div class="bar"><i style="width:${Math.round((i / n) * 100)}%"></i></div><span>${i}/${n}</span></div>`;
    return `<div class="seg-wrap"><div class="seg">${[...Array(n)].map((_, k) => `<i class="${k < i - 1 ? 'done' : k === i - 1 ? 'cur' : ''}"></i>`).join('')}</div><span>${i}/${n}</span></div>`;
  }
  // Đầu trang lớn (tiêu đề + Chíp) dùng cho các trang trong
  const pageHero = ({ title, sub = '', mood = 'happy', say = '', extra = '' }) => `
    <header class="page-hero">
      <div class="ph-text"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
      <div class="ph-mascot">${say ? `<div class="say">${say}</div>` : ''}${mascotSVG(mood, 150)}${extra}</div>
    </header>`;

  // ---------- Mascot mood & message ----------
  function mascotState() {
    const name = esc(S.profile.name);
    const n = currentStreak();
    if (studiedToday()) {
      if (lessonsToday() >= goalInfo().lessons) return { mood: 'cheer', sub: 'Hôm nay bạn giỏi quá!', say: 'Đạt mục tiêu rồi! 🎉' };
      return { mood: 'happy', sub: `Đã giữ chuỗi ${n} ngày 🔥`, say: 'Học thêm 1 bài nhé!' };
    }
    if (streakLost()) return { mood: 'sad', sub: 'Mình bắt đầu chuỗi mới nhé!', say: `Chíp nhớ ${name} lắm…` };
    if (reminderPassed()) return { mood: 'sad', sub: 'Đến giờ học rồi!', say: n > 0 ? `Giữ chuỗi ${n} ngày nhé!` : 'Học 5 phút thôi!' };
    const h = new Date().getHours();
    if (h < 6 || h >= 22) return { mood: 'sleep', sub: 'Khuya rồi, mai học tiếp nhé!', say: 'Zzz…' };
    return { mood: 'happy', sub: 'Sẵn sàng học chưa?', say: 'Học 5 phút thôi!' };
  }

  // ---------- Screens ----------
  let view = 'home';
  let L = null; // current lesson

  function render() {
    stopListening();
    if (!S.profile) return renderOnboarding();
    if (view === 'lesson' && L) return renderLesson();
    if (view === 'settings') return renderSettings();
    if (view === 'speak') return renderSpeakHome();
    if (view === 'map') return renderMap();
    if (view === 'rewards') return renderRewards();
    return renderHome();
  }
  function go(v) { sfx.tap(); view = v; render(); window.scrollTo(0, 0); }

  // Khung chung: thanh điều hướng (dưới trên điện thoại, bên trái trên iPad/PC) + nội dung
  const NAV = [
    { id: 'home', icon: 'home', label: 'Trang chủ' },
    { id: 'map', icon: 'book', label: 'Bài học' },
    { id: 'review', icon: 'review', label: 'Ôn tập' },
    { id: 'speak', icon: 'mic', label: 'Luyện đọc' },
    { id: 'rewards', icon: 'gift', label: 'Phần thưởng', wide: true },
    { id: 'settings', icon: 'gear', label: 'Cài đặt' },
  ];
  function shell(active, inner) {
    const info = gradeInfo(S.profile.grade);
    app.innerHTML = `
      <div class="shell">
        <nav class="nav" aria-label="Điều hướng">
          <div class="nav-brand"><img src="icons/icon-192.png" alt=""><span>Chíp<small>English</small></span></div>
          ${NAV.map((it) => `<button class="nav-item ${it.id === active ? 'active' : ''} ${it.wide ? 'wide-only' : ''}" data-nav="${it.id}">
            ${ICON[it.icon]}<span class="nav-label">${it.label}</span></button>`).join('')}
          <button class="nav-profile" data-nav="settings">${mascotSVG('happy', 44)}<span><b>${esc(S.profile.name)}</b><small>${info.name}</small></span></button>
        </nav>
        <main class="shell-main">${inner}</main>
      </div>`;
    $$('[data-nav]').forEach((b) => b.onclick = () => {
      const id = b.dataset.nav;
      if (id === 'review') return openReview();
      if (id !== view) go(id);
    });
  }
  async function openReview() {
    const g = S.profile.grade, data = await loadGrade(g);
    const seen = data ? allWords(g, data).filter((w) => S.words[w.key]).length : 0;
    if (seen < 4) { sfx.bad(); return toast('Học ít nhất 1 Unit để mở phần Ôn tập nhé!'); }
    startReview(g, data);
  }

  // ---------- Onboarding ----------
  function renderOnboarding(step = 0, draft = { name: '', grade: 1, reminder: '19:00', goal: 30, notify: true }) {
    const floats = [['🐱', 'cat', 'f1'], ['🚲', 'bike', 'f2'], ['🍎', 'apple', 'f3'], ['📘', 'book', 'f4']];
    const tones = ['pink', 'peach', 'lemon', 'mint', 'sky', 'lilac'];
    const body = step === 0 ? `
      <div class="ob-hero">
        ${floats.map(([e, w, c]) => `<div class="float-card ${c}"><span>${e}</span><b>${w}</b></div>`).join('')}
        ${mascotSVG('happy', 210)}
      </div>
      <h1 class="ob-title"><span class="spark">✦</span> Chào bạn! Mình là Chíp <span class="spark">✦</span></h1>
      <label class="field"><span>Bạn tên là gì?</span>
        <div class="input-icon">${ICON.user}<input id="ob-name" maxlength="20" placeholder="Nhập tên của bạn" value="${esc(draft.name)}" autocomplete="off"></div></label>
      <div class="field"><span>Bạn học lớp mấy?</span>
        <div class="grade-grid">${window.GRADES.map((g, i) => `
          <button class="grade-tile ${g.src ? '' : 'soon'} ${g.id === draft.grade ? 'active' : ''} t-${tones[i % tones.length]}" data-grade="${g.id}" ${g.src ? '' : 'disabled'}>
            <b>${g.name}</b>${g.id === draft.grade ? `<i class="tick">${ICON.check}</i>` : g.src ? '' : `${ICON.lock}<small>Sắp có</small>`}</button>`).join('')}</div>
      </div>` : `
      <div class="ob-hero small">
        <div class="say big">Mấy giờ Chíp<br>nhắc bạn học?</div>
        ${mascotSVG('happy', 190)}<span class="ob-clock">⏰</span>
      </div>
      <label class="time-card">${ICON.clock}<input id="ob-time" type="time" value="${draft.reminder}"></label>
      <div class="field"><span>Mỗi ngày bạn muốn học bao nhiêu?</span>
        <div class="goal-list">${GOALS.map((g) => `
          <button class="goal-opt t-${g.tone} ${g.xp === draft.goal ? 'active' : ''}" data-goal="${g.xp}">
            <span class="go-icon">${g.icon}</span><span class="go-text"><b>${g.label}</b><small>${g.sub}</small></span><i class="radio">${ICON.check}</i></button>`).join('')}</div>
      </div>
      <div class="row-card">${ICON.bell}<span>Bật thông báo nhắc học</span>${toggle('ob-notify', draft.notify)}</div>`;
    app.innerHTML = `
      <section class="screen onboarding step-${step}">
        <div class="ob-top">
          ${step > 0 ? `<button class="round-btn" id="ob-back" aria-label="Quay lại">${ICON.back}</button>` : '<span></span>'}
          <div class="dots">${[0, 1].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div><span></span>
        </div>
        <div class="ob-body">${body}</div>
        <button class="btn btn-primary btn-block btn-lg" id="ob-next">${step === 1 ? 'Bắt đầu học!' : `Tiếp tục ${ICON.chev}`}</button>
      </section>`;
    $$('.grade-tile').forEach((b) => b.onclick = () => { draft.name = $('#ob-name').value; draft.grade = +b.dataset.grade; renderOnboarding(0, draft); });
    $$('.goal-opt').forEach((b) => b.onclick = () => { draft.goal = +b.dataset.goal; $$('.goal-opt').forEach((x) => x.classList.toggle('active', x === b)); });
    const back = $('#ob-back'); if (back) back.onclick = () => { draft.reminder = $('#ob-time').value || draft.reminder; renderOnboarding(0, draft); };
    $('#ob-next').onclick = async () => {
      if (step === 0) {
        draft.name = $('#ob-name').value.trim();
        if (!draft.name) { $('#ob-name').focus(); return toast('Bạn nhập tên nhé!'); }
        return renderOnboarding(1, draft);
      }
      draft.reminder = $('#ob-time').value || '19:00';
      const wantNotify = $('#ob-notify').checked;
      S.profile = { name: draft.name, grade: draft.grade, reminder: draft.reminder, goal: draft.goal, unlockAll: false };
      save();
      if (wantNotify && 'Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch (e) {}
      }
      view = 'home'; render();
    };
  }

  // ---------- Home ----------
  async function renderHome() {
    const g = S.profile.grade;
    const data = await loadGrade(g);
    const n = currentStreak();
    const ms = mascotState();
    const goal = goalInfo();
    const done = Math.min(lessonsToday(), goal.lessons);
    const next = data && nextUnitOf(g, data);
    const week = thisWeek();
    const tiles = [
      { go: 'map', tone: 'blue', icon: '📖', label: 'Học từ mới' },
      { go: 'speak', tone: 'peach', icon: `<img src="assets/icons/mic.png" alt="">`, label: 'Luyện đọc' },
      { go: 'review', tone: 'mint', icon: '🔁', label: 'Ôn từ khó' },
      { go: 'rewards', tone: 'pink', icon: '🏆', label: 'Phần thưởng' },
    ];
    shell('home', `
      <section class="page home">
        <div class="home-main">
          <header class="home-hero">
            <div class="hh-text"><h1>Chào ${esc(S.profile.name)}!</h1><p>${ms.sub}</p></div>
            <div class="hh-mascot"><div class="say">${ms.say}</div>${mascotSVG(ms.mood, 170)}</div>
          </header>
          <div class="stats">
            <button class="stat-card" data-go="rewards"><span class="si">🔥</span><b>${n}</b><small>ngày</small></button>
            <button class="stat-card" data-go="rewards"><span class="si">⭐</span><b>${S.xp}</b><small>XP</small></button>
            <button class="stat-card" data-go="review"><span class="si">📚</span><b>${learnedCount(g)}</b><small>từ</small></button>
          </div>
          <div class="goal-card">
            <div class="gc-mascot">${mascotSVG(done >= goal.lessons ? 'cheer' : 'happy', 120)}</div>
            <div class="gc-body">
              <h3>Mục tiêu hôm nay</h3>
              <div class="gc-bar"><div class="bar yellow"><i style="width:${Math.round((done / goal.lessons) * 100)}%"></i></div><b>${done}/${goal.lessons}</b></div>
              <div class="gc-pills">
                <span class="pill">${done >= goal.lessons ? '🎉 Hoàn thành' : `📝 Còn ${goal.lessons - done} bài`}</span>
                ${next ? `<span class="pill">⏩ Tiếp: ${uname(next)}</span>` : ''}
              </div>
            </div>
          </div>
          ${next ? `
          <h2 class="sec-title">Học tiếp</h2>
          <button class="continue-card" id="btn-continue">
            <span class="cc-text"><b>${uname(next)} – ${esc(next.title)}</b><small>${esc(next.vi)}${next.parts.length > 1 ? ` · Phần ${nextPartOf(g, next) + 1}/${next.parts.length}` : ''}</small></span>
            <span class="cc-pics">${[...next.parts[nextPartOf(g, next)].filter((w) => !w.noPic), { emoji: next.icon || '📘' }].slice(0, 4).map((w) => `<span>${pic(w)}</span>`).join('')}</span>
            <span class="cc-play">${ICON.play}</span>
          </button>` : ''}
          <h2 class="sec-title">Chủ đề</h2>
          <div class="topic-grid">${tiles.map((t) => `
            <button class="topic t-${t.tone}" data-go="${t.go}"><span class="tp-icon">${t.icon}</span><b>${t.label}</b><span class="tp-chev">${ICON.chev}</span></button>`).join('')}
          </div>
        </div>
        <aside class="home-side">
          <div class="card side-streak" data-go="rewards">
            ${mascotSVG(n ? 'streak' : 'think', 110)}
            <b>${n} ngày liên tiếp</b><small>Kỷ lục: ${S.streak.best} ngày</small>
            <div class="week-dots">${week.map((d) => `<span class="${S.days[d.key] ? 'on' : ''} ${d.key === today() ? 'today' : ''}"><small>${d.label}</small><i>${S.days[d.key] ? ICON.check : ''}</i></span>`).join('')}</div>
          </div>
          <button class="card side-remind" data-go="settings"><span class="sr-icon">⏰</span><span><small>Giờ nhắc học</small><b>${S.profile.reminder}</b></span>${ICON.chev}</button>
        </aside>
      </section>`);
    $$('[data-go]').forEach((b) => b.onclick = () => b.dataset.go === 'review' ? openReview() : go(b.dataset.go));
    const cont = $('#btn-continue');
    if (cont) cont.onclick = () => openUnit(g, data, next);
    checkReminder();
  }

  // ---------- Lộ trình Unit (Bài học) ----------
  async function renderMap() {
    const g = S.profile.grade, data = await loadGrade(g), info = gradeInfo(g);
    if (!data) { shell('map', '<p class="empty">Chưa có dữ liệu cho lớp này.</p>'); return; }
    const states = unitStates(g, data);
    const ROW = 170;
    // đường chấm nối các đồng xu (so le trái – phải)
    const xs = states.map((_, i) => (i % 2 ? 68 : 32));
    const d = xs.map((x, i) => {
      const y = i * ROW + 85;
      if (!i) return `M${x} ${y}`;
      const px = xs[i - 1], py = (i - 1) * ROW + 85;
      return `C${px} ${py + ROW * 0.55} ${x} ${y - ROW * 0.55} ${x} ${y}`;
    }).join(' ');
    shell('map', `
      <section class="page map">
        <header class="map-head"><h1>${esc(info.book)}</h1><p>${info.name} · ${data.units.length} Unit</p></header>
        <div class="map-path" style="height:${states.length * ROW}px">
          <svg class="map-line" viewBox="0 0 100 ${states.length * ROW}" preserveAspectRatio="none"><path d="${d}"/></svg>
          ${states.map((s, i) => `
            <div class="map-row ${i % 2 ? 'right' : 'left'}" style="top:${i * ROW}px">
              <button class="coin ${s.done ? 'gold' : s.locked ? 'grey' : 'purple'} ${s.next ? 'current' : ''}" data-unit="${i}" aria-label="${uname(s.u)}">
                ${s.done ? starsHtml(s.stars, 'coin-stars') : ''}
                <span class="coin-face ${s.u.badge.length > 1 ? 'num' : ''}">${s.u.badge}</span>
                ${s.locked ? `<span class="coin-lock">${ICON.lock}</span>` : ''}
                <span class="island"></span>
              </button>
              ${s.next ? `<div class="coin-chip">${mascotSVG('happy', 92)}<div class="say">Học tiếp nào!</div></div>` : ''}
              <button class="unit-pill ${s.next ? 'wide' : ''}" data-unit="${i}"><span><b>${uname(s.u)}</b>${s.next || window.innerWidth >= 768 ? `<small>${esc(s.u.title)}</small>` : ''}${s.total > 1 && !s.locked ? `<em class="part-prog">${s.doneParts}/${s.total} phần</em>` : ''}</span>${ICON.chev}</button>
            </div>`).join('')}
        </div>
      </section>`);
    $$('[data-unit]').forEach((b) => b.onclick = () => {
      const s = states[+b.dataset.unit];
      if (s.locked) { sfx.bad(); return toast('Hoàn thành Unit trước để mở khóa nhé!'); }
      openUnit(g, data, s.u);
    });
    const cur = $('.coin.current');
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
  }

  // Thẻ từ nhỏ trong popup Unit; từ không có hình thì hiện từ loại thay cho hình, lớp lớn hiện thêm nghĩa
  const miniWord = (w) => `<button class="mini-word ${w.noPic ? 'no-pic' : ''}" data-en="${esc(w.en)}">
    <span>${w.noPic ? `<i class="mw-pos">${esc(w.pos || 'Aa')}</i>` : pic(w)}</span>${esc(w.en)}
    ${w.ipa ? `<small class="ipa">/${esc(w.ipa)}/</small>` : ''}${w.pos ? `<small class="mw-vi">${esc(w.vi)}</small>` : ''}</button>`;
  function openUnit(g, data, u) {
    sfx.tap();
    const tone = TONES[(u.id - 1) % TONES.length];
    const pr = unitProgress(g, u);
    const multi = u.parts.length > 1;
    // Unit nhiều từ: mỗi phần là một bài học riêng (học từ mới + luyện đọc)
    const partsHtml = multi ? `<div class="part-list">${u.parts.map((ws, p) => {
      const st = S.units[partKey(g, u, p)], sp = S.speak[partKey(g, u, p)];
      return `
        <div class="part-row ${st ? 'done' : ''}">
          <div class="pr-head"><b>Phần ${p + 1}</b><small>${ws.length} từ${st ? ' · ' + starsHtml(st.stars) : ''}</small>
            <span class="pr-actions"><button class="round-btn sm" data-speak="${p}" aria-label="Luyện đọc phần ${p + 1}">${ICON.mic}</button>
            <button class="btn btn-primary sm" data-learn="${p}">${st ? 'Học lại' : 'Học'} ${ICON.chev}</button></span></div>
          <div class="mini-words">${ws.map(miniWord).join('')}</div>
        </div>`;
    }).join('')}</div>` : `<div class="mini-words">${u.words.map(miniWord).join('')}</div>`;
    modal(`
      <div class="unit-head"><button class="letter-ball t-${tone} has-sound ${u.letter ? '' : 'emoji'}" id="letter-sound" aria-label="Nghe">${u.letter || u.icon || u.badge}<i>${ICON.sound}</i></button>
        <div><small>${uname(u)}${pr.done ? ` · ${starsHtml(pr.stars)}` : multi ? ` · ${pr.doneParts}/${pr.total} phần` : ''}</small><h3>${esc(u.title)}</h3><p>${esc(u.vi)} · ${u.words.length} từ</p></div></div>
      ${partsHtml}
      ${u.patterns ? `<div class="sentences"><small>Mẫu câu của bài</small>${u.patterns.map((s) => `<button class="sentence" data-s="${esc(s)}"><i>${ICON.sound}</i>${esc(s)}</button>`).join('')}</div>` : ''}
      ${multi ? '' : `<div class="row-actions">
        <button class="btn btn-ghost" data-speak="0">${ICON.mic} Luyện đọc</button>
        <button class="btn btn-primary" data-learn="0">Học từ mới ${ICON.chev}</button>
      </div>`}`, {
      cls: multi ? 'wide' : '',
      onMount: (m, close) => {
        $('#letter-sound', m).onclick = () => (u.sound ? playFile(u.sound, 1) : ttsSpeak(u.letter || u.title, 0.7));
        $$('.mini-word', m).forEach((b) => b.onclick = () => speak(u.words.find((w) => w.en === b.dataset.en)));
        $$('.sentence', m).forEach((b) => b.onclick = () => speak(b.dataset.s.replace(' – ', ' ')));
        $$('[data-learn]', m).forEach((b) => b.onclick = () => { close(); startLesson(g, data, u, +b.dataset.learn); });
        $$('[data-speak]', m).forEach((b) => b.onclick = () => { close(); startSpeak(g, data, u, +b.dataset.speak); });
        const nx = m.querySelector(`.part-row:nth-child(${nextPartOf(g, u) + 1})`);
        if (multi && nx && pr.doneParts) nx.scrollIntoView({ block: 'nearest' });
      },
    });
  }

  // ---------- Lesson engine ----------
  // Dạng câu hỏi: listen (nghe → chọn hình), pic (hình → chọn từ), meaning (từ → chọn nghĩa),
  // vi2en (nghĩa → chọn từ), hear (nghe → chọn từ), spell (xếp chữ). Từ không có hình chỉ dùng dạng chữ.
  const PIC_TYPES = ['listen', 'pic'];
  function makeQuestion(type, w, pool) {
    const same = (x) => x.en.toLowerCase() === w.en.toLowerCase() || x.vi === w.vi || (PIC_TYPES.includes(type) && x.emoji === w.emoji);
    // ưu tiên đáp án nhiễu cùng Unit và cùng từ loại để câu hỏi không quá dễ
    let cand = pool.filter((x) => !same(x) && (!PIC_TYPES.includes(type) || !x.noPic));
    const near = shuffle(cand.filter((x) => x.unit === w.unit && (!w.pos || x.pos === w.pos)));
    const rest = shuffle(cand.filter((x) => !near.includes(x)));
    const others = [...near, ...rest].filter((x, i, a) => a.findIndex((y) => y.en.toLowerCase() === x.en.toLowerCase()) === i);
    return { type, word: w, options: shuffle([w, ...others.slice(0, 3)]) };
  }
  function buildQuiz(words, pool) {
    const qs = [];
    words.forEach((w) => {
      const types = w.noPic ? ['meaning', 'vi2en', 'hear'] : ['listen', 'pic', 'meaning', 'vi2en'];
      if (/^[a-z]{2,9}$/.test(w.en)) types.push('spell');
      shuffle(types).slice(0, 2).forEach((t) => qs.push(makeQuestion(t, w, pool)));
    });
    return shuffle(qs);
  }

  function startLesson(g, data, u, part = nextPartOf(g, u)) {
    const pool = allWords(g, data);
    const inPart = u.parts[part] || u.words;
    const words = pool.filter((w) => w.unit === u && inPart.includes(u.words.find((x) => x.en === w.en)));
    L = { kind: 'unit', g, data, u, part, words, phase: 'learn', idx: 0, queue: buildQuiz(words, pool), done: 0, mistakes: 0 };
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
    L = { kind: 'review', g, data, words, phase: 'quiz', idx: 0, queue: buildQuiz(words, pool), done: 0, mistakes: 0 };
    L.total = L.queue.length;
    view = 'lesson'; render();
  }

  function exitLesson() {
    if (L && L.phase !== 'result') {
      return modal(`<div class="sheet-mascot">${mascotSVG('sad', 150)}</div>
        <h2 class="sheet-title">Ơ, bạn muốn dừng à?</h2><p class="sheet-sub">Tiến độ bài này sẽ không được lưu đâu…</p>
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
  function leaveLesson(to) {
    stopListening();
    view = to || (L && L.kind === 'speak' ? 'speak' : 'home');
    L = null; render();
  }

  function renderLesson() {
    if (L.phase === 'learn') return renderLearnCard();
    if (L.phase === 'quiz') return renderQuestion();
    if (L.phase === 'speak') return renderSpeak();
    return renderResult();
  }

  function lessonShell({ title = '', seg = null, pills = '', body, footer = '', cls = '' }) {
    stopListening();
    app.innerHTML = `
      <section class="screen lesson ${cls}">
        <header class="lesson-top">
          <button class="round-btn" id="btn-exit" aria-label="Thoát">${L.phase === 'learn' ? ICON.back : ICON.close}</button>
          <div class="lt-center">${title ? `<h2>${title}</h2>` : ''}${seg ? segBar(seg[0], seg[1]) : ''}</div>
          <div class="lt-right">${pills}</div>
        </header>
        <div class="lesson-body">${body}</div>
        <footer class="lesson-foot" id="foot">${footer}</footer>
      </section>`;
    $('#btn-exit').onclick = exitLesson;
    window.scrollTo(0, 0);
  }

  function renderLearnCard() {
    const w = L.words[L.idx];
    // Chỉ hiện câu ví dụ có chứa đúng từ đang học (tối đa 2 câu)
    const examples = [...(L.u.patterns || []), ...(L.u.sentences || [])].filter((s) => wordRe(w.en).test(s)).slice(0, 2);
    lessonShell({
      title: L.u.parts.length > 1 ? `${uname(L.u)} · Phần ${L.part + 1}` : `${uname(L.u)} · Từ mới`, seg: [L.idx + 1, L.words.length], cls: 'learn',
      body: `
        <div class="flash ${w.noPic ? 'no-pic' : ''}">
          <div class="flash-pic">${pic(w)}</div>
          <div class="flash-word">${esc(w.en)}${posHtml(w)}</div>
          ${ipaHtml(w)}
          <div class="flash-vi">${esc(w.vi)}</div>
          <button class="sound-btn" id="say" aria-label="Nghe">${ICON.sound}</button>
        </div>
        ${examples.map((s) => `<button class="sentence" data-s="${esc(s)}"><i>${ICON.sound}</i>${esc(s)}</button>`).join('')}
        <div class="coach">${mascotSVG('happy', 110)}<div class="say">Nghe và đọc theo nhé!</div></div>`,
      footer: `<div class="row-actions">
        <button class="btn btn-ghost" id="again">${ICON.sound} Nghe lại</button>
        <button class="btn btn-primary" id="next">${L.idx === L.words.length - 1 ? 'Làm bài tập' : 'Tiếp theo'} ${ICON.chev}</button></div>`,
    });
    $('#say').onclick = () => speak(w);
    $('#again').onclick = () => speak(w);
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
    const ABCD = 'ABCD';
    let body = '';
    if (q.type === 'listen') {
      body = `<div class="prompt-card"><h3>Nghe và chọn hình đúng</h3>
          <button class="sound-hero" id="say" aria-label="Nghe lại"><i class="wave l"></i>${ICON.sound}<i class="wave r"></i></button></div>
        <div class="opts pics">${q.options.map((o, i) => `<button class="opt pic" data-i="${i}">${pic(o)}</button>`).join('')}</div>`;
    } else if (q.type === 'pic') {
      body = `<div class="prompt-card"><h3>Đây là gì?</h3><div class="q-pic">${pic(w)}</div></div>
        <div class="opts list">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><em>${ABCD[i]}</em>${esc(o.en)}</button>`).join('')}</div>`;
    } else if (q.type === 'meaning') {
      body = `<div class="prompt-card"><h3>Chọn nghĩa đúng</h3>
          <div class="q-word"><button class="sound-btn" id="say" aria-label="Nghe">${ICON.sound}</button>${esc(w.en)}</div>${ipaHtml(w)}</div>
        <div class="opts list">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><em>${ABCD[i]}</em>${esc(o.vi)}</button>`).join('')}</div>`;
    } else if (q.type === 'vi2en') {
      body = `<div class="prompt-card"><h3>Chọn từ tiếng Anh đúng</h3>
          <div class="q-vi">${esc(w.vi)}${posHtml(w)}</div></div>
        <div class="opts list">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><em>${ABCD[i]}</em>${esc(o.en)}</button>`).join('')}</div>`;
    } else if (q.type === 'hear') {
      body = `<div class="prompt-card"><h3>Nghe và chọn từ đúng</h3>
          <button class="sound-hero" id="say" aria-label="Nghe lại"><i class="wave l"></i>${ICON.sound}<i class="wave r"></i></button></div>
        <div class="opts list">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><em>${ABCD[i]}</em>${esc(o.en)}</button>`).join('')}</div>`;
    } else {
      q.letters = q.letters || shuffle(w.en.split('').map((ch, i) => ({ ch, i })));
      q.answer = [];
      body = `<h3 class="q-heading">Xếp chữ thành từ đúng</h3>
        <div class="prompt-card spell">
          <div class="q-pic">${pic(w)}</div>
          <div class="q-hint">${esc(w.vi)}</div>
          <div class="slots" style="--n:${w.en.length}">${w.en.split('').map((_, i) => `<span class="slot" data-s="${i}"></span>`).join('')}</div>
        </div>
        <div class="tiles">${q.letters.map((t, i) => `<button class="tile t${i % 5}" data-t="${i}">${t.ch}</button>`).join('')}</div>
        <div class="coach center">${mascotSVG('think', 130)}</div>`;
    }
    lessonShell({
      title: L.kind === 'review' ? 'Ôn tập' : 'Luyện tập', cls: `quiz q-${q.type}`,
      pills: `<span class="pill-chip">Câu ${Math.min(L.done + 1, L.total)}/${L.total}</span><span class="pill-chip">⭐ ${L.done} đúng</span>`,
      body,
    });
    const say = $('#say'); if (say) say.onclick = () => speak(w);
    if (['listen', 'meaning', 'hear'].includes(q.type)) setTimeout(() => speak(w), 250);

    if (q.type === 'spell') {
      const slots = $$('.slot'), tiles = $$('.tile');
      const paint = () => slots.forEach((s, i) => { s.textContent = q.answer[i] != null ? q.letters[q.answer[i]].ch : ''; s.classList.toggle('filled', q.answer[i] != null); });
      tiles.forEach((t) => t.onclick = () => {
        if (t.disabled || $('.tiles').classList.contains('locked')) return;
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

  function feedbackPanel(ok, title, sub, buttons) {
    const foot = $('#foot');
    foot.className = 'lesson-foot has-fb';
    foot.innerHTML = `
      <div class="fb-panel ${ok ? 'ok' : 'no'}">
        <div class="fb-mascot">${mascotSVG(ok ? 'cheer' : 'sad', 110)}</div>
        <div class="fb-body"><b>${title}</b>${sub ? `<p>${sub}</p>` : ''}${buttons}</div>
      </div>`;
  }

  function answer(ok, correctHtml) {
    const q = L.queue[0], w = q.word;
    $$('.opts, .tiles, .slots').forEach((x) => x.classList.add('locked'));
    $$('.coach').forEach((x) => x.remove());
    const st = S.words[w.key] || (S.words[w.key] = { c: 0, w: 0 });
    if (ok) { st.c++; sfx.good(); setTimeout(() => speak(w), 350); }
    else { st.w++; L.mistakes++; sfx.bad(); }
    save();
    feedbackPanel(ok, ok ? pick(['Tuyệt vời!', 'Giỏi quá!', 'Chính xác!', 'Siêu ghê!', 'Đúng rồi!']) : 'Chưa đúng rồi!',
      ok ? '' : `Đáp án: ${correctHtml}`,
      `<button class="btn ${ok ? 'btn-success' : 'btn-danger'}" id="cont">Tiếp tục ${ICON.chev}</button>`);
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
      const k = partKey(L.g, L.u, L.part || 0);
      bucket[k] = { stars: Math.max(stars, (bucket[k] || {}).stars || 0) };
    }
    const hadGoal = lessonsToday() >= goalInfo().lessons;
    L.result = { xp, stars, extended: recordXP(xp), goalReached: !hadGoal && lessonsToday() >= goalInfo().lessons };
  }

  function renderResult() {
    const r = L.result;
    const n = currentStreak();
    const partTxt = L.u && L.u.parts.length > 1 ? ` – Phần ${L.part + 1}` : '';
    const title = L.kind === 'unit' ? `Hoàn thành ${uname(L.u)}${partTxt}!` : L.kind === 'speak' ? `Luyện đọc ${uname(L.u)}${partTxt} xong!` : 'Ôn tập xong rồi!';
    app.innerHTML = `
      <section class="screen result">
        <div class="res-mascot"><span class="burst"></span>${mascotSVG(r.extended || r.stars === 3 ? 'fire' : 'cheer', 230)}</div>
        <h1><span class="spark">✦</span>${title}<span class="spark">✦</span></h1>
        ${L.kind === 'speak' ? `<p class="res-note">Đọc chuẩn ${L.items.length - L.mistakes}/${L.items.length} lượt 🎤</p>` : ''}
        ${L.kind !== 'review' ? `<div class="res-stars">${[0, 1, 2].map((i) => `<i class="${i < r.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</i>`).join('')}</div>` : ''}
        <div class="xp-pill">+${r.xp} XP</div>
        ${r.extended ? `<div class="res-card fire"><span class="rc-emoji">🔥</span><div><b>${n} ngày liên tiếp!</b><p>${n === 1 ? 'Chuỗi mới bắt đầu rồi. Mai quay lại nhé!' : 'Chuỗi của bạn tăng lên rồi!'}</p></div></div>` : ''}
        ${r.goalReached ? '<div class="res-card goal"><span class="rc-emoji">🎯</span><div><b>Đạt mục tiêu hôm nay!</b></div></div>' : ''}
        <button class="btn btn-primary btn-block btn-lg" id="home">Về trang chủ</button>
        ${L.kind === 'unit' ? '<button class="btn-link" id="more">Học tiếp</button>' : ''}
      </section>`;
    sfx.win(); confetti();
    $('#home').onclick = () => leaveLesson('home');
    const more = $('#more');
    if (more) more.onclick = () => { const { g, data } = L; const nx = nextUnitOf(g, data); L = null; startLesson(g, data, nx); };
  }

  // ---------- Chuỗi ngày học & phần thưởng ----------
  function renderRewards() {
    const n = currentStreak();
    const week = thisWeek();
    const maxXP = Math.max(20, ...week.map((d) => S.days[d.key] || 0));
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    shell('rewards', `
      <section class="page rewards">
        <h1 class="page-title">Chuỗi ngày học</h1>
        <div class="streak-hero">
          ${mascotSVG(n ? 'fire' : 'sad', 230)}
          <h2><span class="big-num">${n}</span> ngày liên tiếp</h2>
          <span class="record">👑 Kỷ lục: <b>${S.streak.best} ngày</b></span>
        </div>
        <div class="rewards-grid">
          <div class="card week-card">
            <div class="week-dots big">${week.map((d) => `<span class="${S.days[d.key] ? 'on' : ''} ${d.key === today() ? 'today' : ''}"><small>${d.label}</small><i>${S.days[d.key] ? ICON.check : ''}</i></span>`).join('')}</div>
          </div>
          <div class="card remind-card">
            <span class="rm-clock">⏰</span>
            <label class="rm-time"><small>Giờ nhắc học</small><input type="time" id="rw-time" value="${S.profile.reminder}"></label>
            ${toggle('rw-notify', perm === 'granted')}
          </div>
          <div class="card chart-card">
            <h3>📊 Điểm XP tuần này</h3>
            <div class="chart">${week.map((d) => { const v = S.days[d.key] || 0; return `<div class="col ${d.key === today() ? 'today' : ''}"><div class="track"><i style="height:${Math.max(6, Math.round((v / maxXP) * 100))}%" title="${v} XP"></i></div><small>${d.label}</small></div>`; }).join('')}</div>
          </div>
          <div class="badges">${BADGES.map((b) => { const got = S.streak.best >= b.days; return `
            <div class="badge ${got ? 'got b-' + b.tone : 'locked'}"><span class="bd-icon">${b.icon}${got ? '' : `<i>${ICON.lock}</i>`}</span><b>${b.days} ngày</b></div>`; }).join('')}</div>
        </div>
      </section>`);
    $('#rw-time').onchange = (e) => { S.profile.reminder = e.target.value || S.profile.reminder; S.remindedOn = null; save(); toast(`Chíp sẽ nhắc lúc ${S.profile.reminder}`); };
    $('#rw-notify').onchange = (e) => setNotify(e.target);
  }

  async function setNotify(input) {
    if (!('Notification' in window)) { input.checked = false; return toast('Trình duyệt không hỗ trợ thông báo'); }
    if (!input.checked) return toast('Muốn tắt hẳn, hãy tắt trong cài đặt trình duyệt');
    const r = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    input.checked = r === 'granted';
    toast(r === 'granted' ? 'Đã bật thông báo! 🔔' : r === 'denied' ? 'Thông báo đang bị chặn trong trình duyệt' : 'Bạn chưa cho phép thông báo');
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

  function startSpeak(g, data, u, part = nextPartOf(g, u, S.speak)) {
    const words = u.parts[part] || u.words;
    // Unit 1 phần: đọc các câu của Unit; Unit nhiều phần: chỉ đọc câu có chứa từ của phần đó
    const all = [...(u.patterns || []), ...(u.sentences || [])];
    const pool = u.parts.length > 1 ? all.filter((s) => words.some((w) => wordRe(w.en).test(s))) : all;
    const sentences = pool.map((s) => s.replace(/\s+–\s+/g, ' '))
      .filter((s, i, a) => a.indexOf(s) === i).slice(0, u.parts.length > 1 ? 3 : 4);
    const items = [
      ...words.map((w) => ({ type: 'word', text: w.en, word: w })),
      ...sentences.map((s) => ({ type: 'sentence', text: s })),
    ];
    L = { kind: 'speak', g, data, u, part, items, idx: 0, phase: 'speak', mistakes: 0, total: items.length };
    view = 'lesson'; render();
  }

  const speakMode = () => SR ? 'sr' : canRecord ? 'rec' : 'self';
  const skipFoot = '<button class="btn-link skip" id="skip">Bỏ qua</button>';
  const waveBars = `<div class="wave-bars" aria-hidden="true">${[...Array(13)].map((_, i) => `<i style="animation-delay:${(i % 5) * 0.12}s"></i>`).join('')}</div>`;

  function renderSpeak() {
    const it = L.items[L.idx];
    it.tries = it.tries || 0;
    it.parts = it.text.split(/\s+/).filter((p) => normText(p));
    it.tokens = it.parts.map(normText);
    lessonShell({
      seg: [L.idx + 1, L.items.length], cls: 'speaking',
      body: `
        <h3 class="q-heading">${it.type === 'word' ? 'Đọc to từ này' : 'Đọc to câu này'}</h3>
        <div class="flash speak-card">
          ${it.word ? `<div class="flash-pic">${pic(it.word)}</div>` : ''}
          <div class="speak-target st-${it.type}" id="target">${it.parts.map((p) => `<span>${esc(p)}</span>`).join(' ')}</div>
          ${it.word ? `${ipaHtml(it.word)}<div class="flash-vi">${esc(it.word.vi)}</div>` : ''}
        </div>
        <div class="speak-listen">
          <button class="btn btn-ghost" id="say">${ICON.sound} Nghe mẫu</button>
          <button class="btn btn-ghost" id="slow"><span class="turtle">🐢</span> Đọc chậm</button>
        </div>
        <div class="mic-zone">
          <button class="mic-btn" id="mic" aria-label="Bấm để đọc">${ICON.mic}</button>
          <div class="mic-mascot">${mascotSVG('think', 120)}</div>
        </div>
        ${waveBars}
        <p class="mic-status" id="mic-status">${speakMode() === 'self' ? 'Đọc to theo mẫu rồi bấm mic để tự đánh giá nhé!' : 'Nghe mẫu, rồi chạm mic và đọc to nhé!'}</p>
        <p class="heard" id="heard"></p>`,
      footer: skipFoot,
    });
    const model = it.word || it.text; // từ: giọng sách; câu: giọng máy
    $('#say').onclick = () => speak(model);
    $('#slow').onclick = () => speak(model, 0.5);
    setTimeout(() => speak(model), 300);
    bindSpeakFoot(it);
    $('#mic').onclick = () => {
      const mode = speakMode();
      if (mode === 'sr') return rec ? rec.stop() : listenSR(it);
      if (mode === 'rec') return media ? media.recorder.stop() : recordSelf(it);
      showSelfCheck(it);
    };
  }
  function setListening(on) {
    $('.speaking') && $('.speaking').classList.toggle('listening', on);
    const m = $('#mic'); if (m) m.classList.toggle('listening', on);
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
    stopSpeaking();
    const status = $('#mic-status'), heard = $('#heard');
    const r = new SR();
    rec = r;
    r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
    let alts = [], error = null;
    $$('#target span').forEach((s) => { s.className = ''; });
    r.onstart = () => { setListening(true); status.textContent = 'Chíp đang nghe… đọc to nhé!'; heard.textContent = ''; };
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      alts = [...res].map((a) => a.transcript);
      heard.textContent = `“${alts[0].trim()}”`;
    };
    r.onerror = (e) => { error = e.error; };
    r.onend = () => {
      clearTimeout(recTimer);
      setListening(false);
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
    feedbackPanel(ok,
      ok ? pick(['Đọc chuẩn quá!', 'Tuyệt vời!', 'Giỏi ghê!']) : near ? 'Gần đúng rồi!' : 'Chưa đúng rồi!',
      ok ? `Điểm đọc: ${Math.round(res.score * 100)}/100` : done ? 'Không sao, mình sang câu tiếp nhé!' : `Nghe mẫu rồi đọc lại nhé! (lần ${it.tries}/3)`,
      done
        ? `<button class="btn ${ok ? 'btn-success' : 'btn-danger'}" id="cont">Tiếp tục ${ICON.chev}</button>`
        : `<div class="row-actions"><button class="btn btn-ghost" id="skip2">Bỏ qua</button><button class="btn btn-pink" id="retry">${ICON.mic} Đọc lại</button></div>`);
    if (done) { $('#cont').onclick = nextSpeak; return; }
    $('#skip2').onclick = nextSpeak;
    $('#retry').onclick = () => { bindSpeakFoot(it); listenSR(it); };
  }

  // Dự phòng khi trình duyệt không nhận được giọng nói: ghi âm, nghe lại và tự đánh giá
  async function recordSelf(it) {
    const status = $('#mic-status');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream), chunks = [];
      const m = media = { stream, recorder, cancelled: false };
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        clearTimeout(recTimer);
        stream.getTracks().forEach((t) => t.stop());
        setListening(false);
        if (m.cancelled) return;
        media = null;
        status.textContent = '';
        showSelfCheck(it, URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
      };
      recorder.start();
      setListening(true);
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
      ${url ? `<button class="btn btn-ghost btn-block" id="playback">${ICON.play} Nghe lại giọng của bạn</button>` : ''}
      <p class="hint center">Bạn đọc giống mẫu chưa?</p>
      <div class="row-actions"><button class="btn btn-ghost" id="again">🔁 Đọc lại</button><button class="btn btn-success" id="good">👍 Giống rồi!</button></div>`;
    if (url) { const a = new Audio(url); a.play().catch(() => {}); $('#playback').onclick = () => a.play(); }
    $('#again').onclick = () => bindSpeakFoot(it);
    $('#good').onclick = () => { it.best = 1; sfx.good(); nextSpeak(); };
  }

  async function renderSpeakHome() {
    const g = S.profile.grade, data = await loadGrade(g), info = gradeInfo(g);
    const cards = data ? unitStates(g, data).map((s, i) => {
      const sp = unitProgress(g, s.u, S.speak);
      const tone = TONES[i % TONES.length];
      const pics = [...s.u.words.filter((w) => !w.noPic), { emoji: s.u.icon || '📘' }].slice(0, 3);
      return `
        <button class="speak-unit ${s.locked ? 'locked' : ''}" data-unit="${i}">
          <span class="letter-ball ${s.locked ? 't-grey' : 't-' + tone}">${s.u.badge}</span>
          <span class="su-info"><b>${uname(s.u)} · ${esc(s.u.title)}</b>${s.locked ? '<small>Chưa mở</small>' : `${starsHtml(sp.stars)}${sp.total > 1 ? `<small class="su-parts">${sp.doneParts}/${sp.total} phần</small>` : ''}`}</span>
          <span class="su-pics">${pics.map((w) => `<span>${pic(w)}</span>`).join('')}</span>
          <span class="su-mic">${s.locked ? ICON.lock : ICON.mic}</span>
        </button>`;
    }).join('') : '<p class="empty">Chưa có dữ liệu cho lớp này.</p>';
    const warn = SR ? '' : `<div class="card warn">${canRecord
      ? '⚠️ Trình duyệt này chưa chấm điểm được giọng nói. Bạn vẫn luyện được: ghi âm, nghe lại và tự so với mẫu. Dùng <b>Chrome</b>, <b>Edge</b> hoặc <b>Safari</b> để được Chíp chấm điểm.'
      : '⚠️ Trình duyệt này không dùng được micro. Hãy mở app bằng <b>Chrome</b>, <b>Edge</b> hoặc <b>Safari</b>.'}</div>`;
    shell('speak', `
      <section class="page speak-home">
        ${pageHero({ title: 'Luyện đọc', sub: `${esc(info.name)} · Đọc to theo Chíp`, mood: 'happy', say: 'Chạm mic rồi<br>đọc to nhé!', extra: '<img class="ph-mic" src="assets/icons/mic.png" alt="">' })}
        ${warn}
        <div class="speak-grid">${cards}</div>
      </section>`);
    $$('.speak-unit').forEach((b) => b.onclick = () => {
      if (b.classList.contains('locked')) { sfx.bad(); return toast('Học từ mới của Unit trước để mở khóa nhé!'); }
      const u = data.units[+b.dataset.unit];
      // Unit nhiều phần: mở popup để chọn phần cần luyện đọc (nút mic ở từng phần)
      if (u.parts.length > 1) openUnit(g, data, u); else startSpeak(g, data, u);
    });
  }

  // ---------- Settings ----------
  function renderSettings() {
    const p = S.profile;
    const info = gradeInfo(p.grade);
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const row = (icon, tone, label, right, id = '', cls = '') => `
      <div class="set-row ${cls}" ${id ? `id="${id}"` : ''}><span class="sr-ic t-${tone}">${icon}</span><span class="sr-label">${label}</span>${right}</div>`;
    shell('settings', `
      <section class="page settings">
        ${pageHero({ title: 'Cài đặt', mood: 'happy', extra: '<span class="ph-gear">⚙️</span>' })}
        <div class="settings-grid">
          <div class="set-col">
            <button class="card profile-card" id="s-profile">
              <span class="avatar">${mascotSVG('happy', 96)}</span>
              <span class="pc-text"><b>${esc(p.name)}</b><small>${info.name}</small></span>${ICON.chev}
            </button>
            <div class="card set-group">
              ${row(ICON.target, 'lilac', 'Mục tiêu mỗi ngày', `<span class="sr-value">${goalInfo().label}</span>${ICON.chev}
                <select id="s-goal" class="overlay-input">${GOALS.map((g) => `<option value="${g.xp}" ${g.xp === p.goal ? 'selected' : ''}>${g.label} – ${g.sub}</option>`).join('')}</select>`, '', 'tap')}
            </div>
          </div>
          <div class="set-col">
            <h2 class="sec-title">Nhắc học</h2>
            <div class="card set-group">
              ${row(ICON.clock, 'lilac', 'Giờ nhắc', `<input type="time" id="s-time" class="sr-time" value="${p.reminder}">`)}
              ${row(ICON.bell, 'lilac', 'Thông báo', toggle('s-notify', perm === 'granted'))}
              ${row(ICON.cal, 'rose', 'Thêm vào lịch điện thoại', ICON.chev, 's-ics', 'tap')}
              ${row('🐥', 'lemon', 'Thử lời nhắc của Chíp', ICON.chev, 's-test', 'tap')}
            </div>
            <h2 class="sec-title">Học tập</h2>
            <div class="card set-group">
              ${row(ICON.unlock, 'lilac', 'Mở khóa tất cả Unit', toggle('s-unlock', p.unlockAll))}
              ${row(ICON.trash, 'rose', '<span class="danger">Xóa tiến độ</span>', ICON.chev, 's-reset', 'tap')}
            </div>
            <p class="hint">Thông báo hiện khi app đang mở hoặc chạy nền. Để chắc chắn được nhắc cả khi đóng app, hãy thêm nhắc nhở vào lịch điện thoại (lặp lại hằng ngày).</p>
          </div>
        </div>
      </section>`);
    $('#s-goal').onchange = (e) => { p.goal = +e.target.value; save(); toast('Đã đổi mục tiêu!'); renderSettings(); };
    $('#s-time').onchange = (e) => { if (e.target.value) { p.reminder = e.target.value; S.remindedOn = null; save(); toast(`Chíp sẽ nhắc lúc ${p.reminder}`); } };
    $('#s-notify').onchange = (e) => setNotify(e.target);
    $('#s-unlock').onchange = (e) => { p.unlockAll = e.target.checked; save(); toast(p.unlockAll ? 'Đã mở khóa tất cả Unit' : 'Đã khóa lại theo thứ tự'); };
    $('#s-ics').onclick = () => downloadICS(p.reminder);
    $('#s-test').onclick = () => showReminder(true);
    $('#s-profile').onclick = () => editProfile();
    $('#s-reset').onclick = () => modal(`<div class="sheet-mascot">${mascotSVG('sad', 150)}</div>
      <h2 class="sheet-title">Xóa hết tiến độ?</h2><p class="sheet-sub">Chuỗi ngày, điểm và sao sẽ mất hết. Không thể hoàn tác đâu!</p>
      <div class="row-actions"><button class="btn btn-ghost" id="m-no">Không</button><button class="btn btn-danger" id="m-yes">Xóa</button></div>`, {
      onMount: (m, close) => {
        $('#m-no', m).onclick = close;
        $('#m-yes', m).onclick = () => { close(); S = defaultState(); save(); view = 'home'; render(); };
      },
    });
  }

  function editProfile() {
    const p = S.profile;
    modal(`
      <div class="sheet-mascot">${mascotSVG('happy', 120)}</div>
      <label class="field"><span>Tên của bạn</span><div class="input-icon">${ICON.user}<input id="e-name" maxlength="20" value="${esc(p.name)}"></div></label>
      <label class="field"><span>Lớp</span><select id="e-grade" class="select">${window.GRADES.map((g) => `<option value="${g.id}" ${g.id === p.grade ? 'selected' : ''} ${g.src ? '' : 'disabled'}>${g.name}${g.src ? '' : ' (sắp có)'}</option>`).join('')}</select></label>
      <div class="row-actions"><button class="btn btn-ghost" id="e-cancel">Hủy</button><button class="btn btn-primary" id="e-save">Lưu</button></div>`, {
      onMount: (m, close) => {
        $('#e-cancel', m).onclick = close;
        $('#e-save', m).onclick = () => {
          const name = $('#e-name', m).value.trim();
          if (!name) return toast('Tên không được để trống');
          p.name = name; p.grade = +$('#e-grade', m).value; save(); close(); toast('Đã lưu!'); render();
        };
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
      const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-64.png', tag: 'daily-reminder', renotify: true };
      if (reg) reg.showNotification(title, opts); else new Notification(title, opts);
    } catch (e) {}
  }
  function showReminder(test = false) {
    const n = currentStreak();
    const name = esc(S.profile.name);
    const sub = n > 0 ? `Học ngay để giữ chuỗi ${n} ngày 🔥 nhé!` : 'Học với Chíp 5 phút thôi!';
    if (!test) notify('Chíp English', `Chíp đợi ${S.profile.name} nãy giờ nè! ${sub} 🐥`);
    if (view === 'lesson') return;
    modal(`<div class="sheet-mascot big">${mascotSVG('sad', 200)}</div>
      <h2 class="sheet-title">${name} ơi, đến giờ học rồi!</h2><p class="sheet-sub">${sub}</p>
      <div class="row-actions"><button class="btn btn-ghost" id="m-later">Để sau</button><button class="btn btn-primary" id="m-go">Học ngay!</button></div>`, {
      onMount: (m, close) => {
        $('#m-later', m).onclick = close;
        $('#m-go', m).onclick = async () => {
          close();
          const g = S.profile.grade, data = await loadGrade(g);
          if (data) startLesson(g, data, nextUnitOf(g, data));
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
