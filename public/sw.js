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
      .catch(error => {
        console.error('Cache addAll failed:', error.message);
        // Continue with installation even if caching fails
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
  // Skip non-GET requests (fixes PUT issues with POST requests)
  if (event.request.method !== 'GET') {
    return;
  }

  try {
    const url = new URL(event.request.url);
    
    // For HTML pages and API requests, use network first
    if (event.request.mode === 'navigate' || 
        url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Only cache successful responses
            if (!response.ok) {
              return response;
            }
            
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseClone);
                } catch (error) {
                  console.error('Cache put error:', error.message);
                }
              })
              .catch(error => {
                console.error('Cache open error:', error.message);
              });
            return response;
          })
          .catch(() => {
            return caches.match(event.request)
              .then(cachedResponse => {
                return cachedResponse || caches.match('/');
              })
              .catch(error => {
                console.error('Cache match error:', error.message);
                return new Response('Network error occurred', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
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
                // Only cache successful responses
                if (!response.ok) {
                  return response;
                }
                
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    try {
                      cache.put(event.request, responseClone);
                    } catch (error) {
                      console.error('Cache put error:', error.message);
                    }
                  })
                  .catch(error => {
                    console.error('Cache open error:', error.message);
                  });
                return response;
              })
              .catch(error => {
                console.error('Fetch error:', error.message);
                return new Response('Network error occurred', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
          })
          .catch(error => {
            console.error('Cache match error:', error.message);
            return fetch(event.request);
          })
      );
    }
  } catch (error) {
    console.error('Service worker fetch handler error:', error.message);
    // Fall back to normal fetch if our handling fails
    return;
  }
});