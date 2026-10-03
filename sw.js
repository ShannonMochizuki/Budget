const CACHE = 'budget-compass-v1.0.2';
const APP_ROOT = '/Budget/';
const FILES = [
  APP_ROOT,
  APP_ROOT + 'index.html',
  APP_ROOT + 'app.js',
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
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match(APP_ROOT + 'index.html'))));
});
