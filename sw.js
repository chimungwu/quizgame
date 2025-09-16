/* sw.js — cache 靜態資源 + 導覽請求離線備援 */
const CACHE = 'mathgame-v1.0.0';
const ASSETS = [
  './',
  './mathgame.html',
  './manifest.webmanifest',
  './favicon1.png',
  // 若有說明頁，記得加：
  './math-notes.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 1) 導覽請求：網路優先，離線退回 mathgame.html（支援重新整理/深連結）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./mathgame.html'))
    );
    return;
  }

  // 2) 靜態資源：快取優先（之後背景更新）
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
