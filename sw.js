// 美容室カルテ Service Worker
// HTMLは常にネットワーク優先で取得（＝起動のたびに最新版）。オフライン時のみキャッシュを表示。
const CACHE = 'salon-karte-v1'

self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e => {
  const req = e.request
  // ページ本体（HTML）の取得だけを制御。APIや画像はそのまま通す
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./')))
    )
  }
})
