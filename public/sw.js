const CACHE_NAME = 'opensvm-p2p-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/opensvm-logo.svg',
  '/images/icon-192x192.svg',
  '/images/icon-512x512.svg'
];

// Skip waiting to ensure the new service worker activates immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy for HTML and API requests
// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For HTML pages and API requests, use network first
  if (event.request.mode === 'navigate' || 
      url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/');
            });
        })
    );
  } else {
    // For other assets, use cache first
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
              return response;
            });
        })
    );
  }
});