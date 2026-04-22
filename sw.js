// RavHaOhr — Service Worker v1.0
const CACHE_NAME = 'ravhaohr-v1';

// Arquivos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALL — faz cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH — estratégia Network First para API, Cache First para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requisições à API do Rav — sempre vai para a rede, sem cache
  if (url.hostname.includes('workers.dev') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets estáticos — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
