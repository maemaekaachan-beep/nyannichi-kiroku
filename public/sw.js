// にゃんにち記録 - シンプルなservice worker(PWAインストール要件用)
const CACHE_NAME = 'nyannichi-kiroku-v2';
const APP_SHELL = ['/', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // APIリクエスト(/api/...)はキャッシュしない(常に最新データを取得)
  if (event.request.url.includes('/api/')) return;
  if (event.request.method !== 'GET') return;

  // ネットワーク優先: まず最新を取りに行き、失敗したときだけキャッシュを使う
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && new URL(event.request.url).origin === self.location.origin) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/'))
      )
  );
});
