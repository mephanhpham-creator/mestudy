// Chíp – mascot gà con (ảnh 3D trong assets/chip/).
// mood: happy | cheer | sad | sleep | think | book | streak | fire
window.MASCOT_MOODS = ['happy', 'cheer', 'sad', 'sleep', 'think', 'book', 'streak', 'fire'];
window.mascotSVG = function (mood = 'happy', size = 120) {
  const m = window.MASCOT_MOODS.includes(mood) ? mood : 'happy';
  return `<img class="mascot mascot--${m}" src="assets/chip/${m}.png" width="${size}" height="${size}" alt="" draggable="false">`;
};
