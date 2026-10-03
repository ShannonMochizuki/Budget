const CACHE = 'budget-compass-v1.0.5';
const APP_ROOT = '/Budget/';
const CORE = [
  APP_ROOT,
  APP_ROOT + 'index.html',
  APP_ROOT + 'app.js?v=1.0.5',
  APP_ROOT + 'manifest.webmanifest'
];
const OPTIONAL = [
  APP_ROOT + 'icon-192.png',
  APP_ROOT + 'icon-512.png',
  APP_ROOT + 'icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.allSettled(OPTIONAL.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('budget-compass-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, {cache:'no-store'});
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(APP_ROOT + 'index.html', fresh.clone());
        }
        return fresh;
      } catch {
        return (await caches.match(APP_ROOT + 'index.html')) || Response.error();
      }
    })());
    return;
  }

  const isAppCode = url.pathname === APP_ROOT + 'app.js' || url.pathname === APP_ROOT + 'manifest.webmanifest' || url.pathname === APP_ROOT + 'sw.js';
  if (isAppCode) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(async response => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(async response => {
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  })));
});
