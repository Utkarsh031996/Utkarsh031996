const CACHE_NAME = 'interest-calculator-v3';
const ASSETS = [
  './',
  './interest_calculator.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      if (key !== CACHE_NAME) return caches.delete(key);
    }))))
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const acceptHeader = request.headers.get('accept') || '';
  const isHTML = request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() => caches.match('./interest_calculator.html').then(cached => cached || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(networkResponse => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return networkResponse;
      });
    })
  );
});
