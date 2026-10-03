const CACHE = 'budget-compass-v1.0.3';
const APP_ROOT = '/Budget/';
const FILES = [
  APP_ROOT,
  APP_ROOT + 'index.html',
  APP_ROOT + 'app.js?v=1.0.3',
  APP_ROOT + 'manifest.webmanifest',
  APP_ROOT + 'icons/icon-192.png',
  APP_ROOT + 'icons/icon-512.png',
  APP_ROOT + 'icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('budget-compass-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) return;
  const isNavigation = event.request.mode === 'navigate';
  if (isNavigation) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(response => {
      const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(APP_ROOT+'index.html',copy)); return response;
    }).catch(()=>caches.match(APP_ROOT+'index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy)); return response;
  })));
});
