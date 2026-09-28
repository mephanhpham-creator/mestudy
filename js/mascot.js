// Chíp – mascot gà con. mood: happy | cheer | sad | sleep | think
window.mascotSVG = function (mood = 'happy', size = 120) {
  const eyes = {
    happy: `<circle cx="46" cy="58" r="6" fill="#2B2340"/><circle cx="74" cy="58" r="6" fill="#2B2340"/>
            <circle cx="48" cy="56" r="2" fill="#fff"/><circle cx="76" cy="56" r="2" fill="#fff"/>`,
    think: `<circle cx="48" cy="56" r="6" fill="#2B2340"/><circle cx="76" cy="56" r="6" fill="#2B2340"/>
            <circle cx="50" cy="54" r="2" fill="#fff"/><circle cx="78" cy="54" r="2" fill="#fff"/>`,
    cheer: `<path d="M39 60 q7 -10 14 0" stroke="#2B2340" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M67 60 q7 -10 14 0" stroke="#2B2340" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    sad:   `<circle cx="46" cy="61" r="5.5" fill="#2B2340"/><circle cx="74" cy="61" r="5.5" fill="#2B2340"/>
            <path d="M38 50 l14 4 M82 50 l-14 4" stroke="#2B2340" stroke-width="3" stroke-linecap="round"/>
            <path d="M80 70 q-4 7 0 10 q4 -3 0 -10z" fill="#5BC0FF"/>`,
    sleep: `<path d="M39 60 q7 6 14 0" stroke="#2B2340" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M67 60 q7 6 14 0" stroke="#2B2340" stroke-width="4" fill="none" stroke-linecap="round"/>
            <text x="92" y="30" font-family="Nunito,sans-serif" font-weight="900" font-size="16" fill="#7C5CFF">z</text>
            <text x="102" y="18" font-family="Nunito,sans-serif" font-weight="900" font-size="12" fill="#7C5CFF">z</text>`,
  }[mood] || '';
  const beak = mood === 'cheer' || mood === 'happy'
    ? `<path d="M52 70 h16 l-8 11z" fill="#FF8A3D"/><path d="M55 72 h10 l-5 5z" fill="#D9482B"/>`
    : `<path d="M52 70 h16 l-8 8z" fill="#FF8A3D"/>`;
  const wings = mood === 'cheer'
    ? `<ellipse cx="18" cy="56" rx="9" ry="17" fill="#FFC300" transform="rotate(-35 18 56)"/>
       <ellipse cx="102" cy="56" rx="9" ry="17" fill="#FFC300" transform="rotate(35 102 56)"/>`
    : `<ellipse cx="20" cy="78" rx="9" ry="16" fill="#FFC300" transform="rotate(20 20 78)"/>
       <ellipse cx="100" cy="78" rx="9" ry="16" fill="#FFC300" transform="rotate(-20 100 78)"/>`;
  return `<svg class="mascot mascot--${mood}" width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="114" rx="30" ry="4" fill="rgba(0,0,0,.08)"/>
    <path d="M46 104 l-5 9 M46 104 l0 10 M46 104 l5 9 M74 104 l-5 9 M74 104 l0 10 M74 104 l5 9" stroke="#FF8A3D" stroke-width="3.5" stroke-linecap="round"/>
    ${wings}
    <path d="M58 22 q-6 -14 4 -16 q-2 8 6 10 q-6 0 -10 6z" fill="#FFC300"/>
    <circle cx="60" cy="66" r="42" fill="#FFD43B"/>
    <ellipse cx="60" cy="84" rx="26" ry="20" fill="#FFE894"/>
    <circle cx="34" cy="72" r="6" fill="#FF9BB3" opacity=".7"/>
    <circle cx="86" cy="72" r="6" fill="#FF9BB3" opacity=".7"/>
    ${eyes}${beak}
  </svg>`;
};
