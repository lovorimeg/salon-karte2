// 美容室カルテ Service Worker
// HTMLは「キャッシュで即表示 → 裏で最新を取得して次回反映」(stale-while-revalidate)。
// 起動が速いまま、自動更新も保てる。オフライン時もキャッシュで表示。
const CACHE = 'salon-karte-v2'

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
      caches.open(CACHE).then(cache =>
        cache.match(req).then(cached => {
          // 裏で最新を取得してキャッシュ更新（次回起動で反映）
          const fetchPromise = fetch(req).then(res => {
            cache.put(req, res.clone()); return res
          }).catch(() => cached)
          // キャッシュがあれば即返す。無ければネットを待つ
          return cached || fetchPromise
        })
      )
    )
  }
})
