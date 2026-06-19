// 美容室カルテ Service Worker
// HTMLは「まず最新を取りに行く（network-first）→ 取れなければキャッシュ」方式。
// オンラインなら常に最新が表示され、オフライン時のみキャッシュで表示する。
const CACHE = 'salon-karte-v4'

self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
))

self.addEventListener('fetch', e => {
  const req = e.request
  // ページ本体（HTML）の取得だけを制御。APIや画像はそのまま通す
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(req, copy))
        return res
      }).catch(() => caches.match(req))
    )
  }
})
