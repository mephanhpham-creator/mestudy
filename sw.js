// Tăng VERSION mỗi khi cập nhật nội dung để điện thoại tải bản mới.
const VERSION = 'chip-v13';
const ASSETS = [
  './', 'index.html', 'css/style.css', 'js/app.js', 'js/mascot.js',
  'data/grades.js', 'data/grade1.js', 'data/grade3.js', 'data/grade7.js', 'manifest.webmanifest',
  'icons/icon-64.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/icons/mic.png',
  ...['happy', 'cheer', 'sad', 'sleep', 'think', 'book', 'streak', 'fire'].map((m) => `assets/chip/${m}.png`),
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network-first cho file của app (luôn lấy bản mới khi có mạng), fallback cache khi offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      // chỉ lưu bản đầy đủ (200); audio phát theo đoạn (206) không lưu được vào cache
      if (res.status === 200 && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
