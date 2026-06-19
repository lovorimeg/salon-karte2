// 美容室カルテ Service Worker
// HTMLは「毎回キャッシュバスター付きで強制的にネットから取得」方式。
// GitHub PagesのCDN/中間キャッシュ・iOSのHTTPキャッシュを問わず、常に最新を取りに行く。
// オフライン時のみ、最後に取得できた内容を表示する。
const CACHE = 'salon-karte-v5'

self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
))

self.addEventListener('fetch', e => {
  const req = e.request
  // ページ本体（HTML）の取得だけを制御。APIや画像はそのまま通す
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        // URLにタイムスタンプを付け、CDN・ブラウザ・端末のあらゆるキャッシュ層を迂回する
        const bustUrl = req.url.split('#')[0] + (req.url.includes('?') ? '&' : '?') + '_sw=' + Date.now()
        const res = await fetch(bustUrl, { cache: 'no-store', credentials: 'same-origin' })
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(req, copy))
        return res
      } catch (e) {
        const cached = await caches.match(req)
        return cached || Response.error()
      }
    })())
  }
})
