// 美容室カルテ Service Worker
// v6: 「前回の画面で即起動 → 裏で最新を取得 → 変わっていたらページに通知」方式。
// 起動が一瞬になり、鮮度も保つ（新しい版が届いたらページ側が起動直後なら自動リロード）。
// 初回やキャッシュが無い時は従来通りネットから取得。オフライン時は最後の取得内容を表示。
const CACHE = 'salon-karte-v6'

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
      const cached = await caches.match(req)
      // 裏で必ず最新を取得（URLにタイムスタンプを付け、CDN・端末のキャッシュ層を迂回）
      const fetchFresh = (async () => {
        const bustUrl = req.url.split('#')[0] + (req.url.includes('?') ? '&' : '?') + '_sw=' + Date.now()
        const res = await fetch(bustUrl, { cache: 'no-store', credentials: 'same-origin' })
        const newText = await res.clone().text()
        const oldText = cached ? await cached.clone().text() : null
        const cache = await caches.open(CACHE)
        await cache.put(req, new Response(newText, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
        if (oldText !== null && oldText !== newText) {
          // 新しい版が届いたことをページに知らせる（ページ側が起動直後なら自動で切り替え）
          const clients = await self.clients.matchAll({ type: 'window' })
          clients.forEach(c => c.postMessage({ type: 'fresh-available' }))
        }
        return new Response(newText, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      })()
      if (cached) {
        fetchFresh.catch(() => {})  // 取得失敗しても表示済みの画面には影響なし
        return cached
      }
      try {
        return await fetchFresh
      } catch (err) {
        return Response.error()
      }
    })())
  }
})
