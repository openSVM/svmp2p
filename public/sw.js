const CACHE_NAME = 'opensvm-p2p-v3';
const STATIC_CACHE_NAME = 'opensvm-static-v3';
const RUNTIME_CACHE_NAME = 'opensvm-runtime-v3';
const JS_CACHE_NAME = 'opensvm-js-v3';
const CSS_CACHE_NAME = 'opensvm-css-v3';

// Critical assets to cache immediately for fast startup
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/opensvm-logo.svg',
  '/images/icon-192x192.svg',
  '/images/icon-512x512.svg',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// Critical JavaScript chunks to cache for faster startup
const criticalJSChunks = [
  '/build/_next/static/chunks/react',
  '/build/_next/static/chunks/main',
  '/build/_next/static/chunks/pages/_app'
];

// API endpoints to cache for offline functionality
const apiEndpointsToCache = [
  '/api/networks',
  '/api/user/profile',
  '/api/offers'
];

// Maximum age for cached responses
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
const JS_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days for JS chunks

// Skip waiting to ensure the new service worker activates immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2');
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Caching static assets');
          return cache.addAll(urlsToCache);
        })
        .catch(error => {
          console.error('[SW] Cache addAll failed:', error.message);
          // Continue with installation even if caching fails
        }),
      
      // Pre-cache critical API endpoints
      caches.open(RUNTIME_CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Pre-caching API endpoints');
          return Promise.all(
            apiEndpointsToCache.map(endpoint => {
              return fetch(endpoint)
                .then(response => {
                  if (response.ok) {
                    return cache.put(endpoint, response);
                  }
                })
                .catch(error => {
                  console.log('[SW] Pre-cache failed for:', endpoint, error.message);
                  // Continue even if pre-caching fails
                });
            })
          );
        })
        .catch(error => {
          console.error('[SW] Runtime cache initialization failed:', error.message);
        })
    ])
  );
});

// Clean up old caches and manage cache versions
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim clients to ensure new SW takes control immediately
      self.clients.claim().then(() => {
        console.log('[SW] Service Worker claimed clients');
      })
    ])
  );
});

// Helper function to check if response is fresh
function isResponseFresh(response) {
  if (!response) return false;
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true; // If no date header, assume fresh
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  return (now - responseTime) < MAX_CACHE_AGE;
}

// Helper function to create offline response
function createOfflineResponse(url) {
  const isApiRequest = url.pathname.startsWith('/api/');
  
  if (isApiRequest) {
    return new Response(JSON.stringify({
      error: 'You are currently offline',
      offline: true,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // For HTML requests, return a simple offline page
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OpenSVM P2P - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: #f9fafb; }
        .offline-container { max-width: 400px; margin: 2rem auto; }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { color: #374151; margin-bottom: 0.5rem; }
        p { color: #6b7280; margin-bottom: 2rem; }
        .retry-btn { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
        .retry-btn:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>You're offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

// Enhanced fetch strategy with better offline support
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  try {
    const url = new URL(event.request.url);
    
    // Handle different types of requests with appropriate strategies
    if (event.request.mode === 'navigate') {
      // Navigation requests: Network first with offline fallback
      event.respondWith(handleNavigationRequest(event.request));
    } else if (url.pathname.startsWith('/api/')) {
      // API requests: Network first with cached fallback and offline handling
      event.respondWith(handleApiRequest(event.request));
    } else if (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico)$/)) {
      // Static assets: Cache first with network fallback
      event.respondWith(handleStaticAsset(event.request));
    } else {
      // Other requests: Network first
      event.respondWith(handleGenericRequest(event.request));
    }
  } catch (error) {
    console.error('[SW] Fetch handler error:', error.message);
    // Fall back to normal fetch if our handling fails
    return;
  }
});

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Navigation network failed, trying cache:', error.message);
    
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse && isResponseFresh(cachedResponse)) {
      return cachedResponse;
    }
    
    // Fall back to cached home page or offline page
    const homeResponse = await caches.match('/');
    if (homeResponse) {
      return homeResponse;
    }
    
    return createOfflineResponse(new URL(request.url));
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`API response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] API network failed, trying cache:', error.message);
    
    // Try cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to cached response
      const cachedJson = await cachedResponse.json();
      const offlineResponse = {
        ...cachedJson,
        _offline: true,
        _cachedAt: new Date().toISOString()
      };
      
      return new Response(JSON.stringify(offlineResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cached': 'true',
          'X-Offline': 'true'
        }
      });
    }
    
    return createOfflineResponse(new URL(request.url));
  }
}

// Handle static assets with optimized caching strategies
async function handleStaticAsset(request) {
  try {
    const url = new URL(request.url);
    const isJSChunk = url.pathname.includes('/_next/static/chunks/');
    const isCSSFile = url.pathname.endsWith('.css');
    
    // Use different cache strategies for different asset types
    let cacheName = STATIC_CACHE_NAME;
    if (isJSChunk) {
      cacheName = JS_CACHE_NAME;
    } else if (isCSSFile) {
      cacheName = CSS_CACHE_NAME;
    }
    
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cached response is still fresh
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const maxAge = isJSChunk ? JS_CACHE_AGE : MAX_CACHE_AGE;
      
      if (Date.now() - cacheDate.getTime() < maxAge) {
        return cachedResponse;
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response with appropriate cache name
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails and we have a cached version, use it even if stale
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error(`Static asset response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.error('[SW] Static asset failed:', error.message);
    
    // Last resort: try any cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Asset not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      return networkResponse;
    }
    
    throw new Error(`Generic request response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Generic request network failed:', error.message);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache available, return a generic error
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'background-sync-profile') {
    event.waitUntil(syncProfile());
  }
});

// Sync queued transactions when online
async function syncTransactions() {
  try {
    console.log('[SW] Syncing queued transactions');
    
    // Get queued transactions from IndexedDB or cache
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    const queuedTransactions = await getQueuedTransactions();
    
    if (queuedTransactions.length === 0) {
      console.log('[SW] No transactions to sync');
      return;
    }
    
    for (const transaction of queuedTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction)
        });
        
        if (response.ok) {
          console.log('[SW] Transaction synced successfully:', transaction.id);
          await removeQueuedTransaction(transaction.id);
          
          // Notify clients about successful sync
          await notifyClients({
            type: 'TRANSACTION_SYNC_SUCCESS',
            transactionId: transaction.id
          });
        } else {
          console.error('[SW] Transaction sync failed:', response.status);
        }
      } catch (error) {
        console.error('[SW] Error syncing transaction:', error.message);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error.message);
  }
}

// Sync profile updates when online
async function syncProfile() {
  try {
    console.log('[SW] Syncing profile updates');
    
    const profileUpdates = await getQueuedProfileUpdates();
    
    if (profileUpdates.length === 0) {
      console.log('[SW] No profile updates to sync');
      return;
    }
    
    for (const update of profileUpdates) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          console.log('[SW] Profile update synced successfully');
          await removeQueuedProfileUpdate(update.id);
          
          await notifyClients({
            type: 'PROFILE_SYNC_SUCCESS',
            updateId: update.id
          });
        }
      } catch (error) {
        console.error('[SW] Error syncing profile update:', error.message);
      }
    }
  } catch (error) {
    console.error('[SW] Profile sync error:', error.message);
  }
}

// Helper functions for managing queued data
async function getQueuedTransactions() {
  // In a real implementation, this would use IndexedDB
  // For now, return empty array as placeholder
  return [];
}

async function removeQueuedTransaction(id) {
  // Placeholder for removing transaction from queue
  console.log('[SW] Removing queued transaction:', id);
}

async function getQueuedProfileUpdates() {
  // Placeholder for getting queued profile updates
  return [];
}

async function removeQueuedProfileUpdate(id) {
  // Placeholder for removing profile update from queue
  console.log('[SW] Removing queued profile update:', id);
}

// Notify all clients about sync events
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'QUEUE_TRANSACTION') {
    // Queue transaction for background sync
    queueTransaction(event.data.transaction);
  } else if (event.data && event.data.type === 'QUEUE_PROFILE_UPDATE') {
    // Queue profile update for background sync
    queueProfileUpdate(event.data.update);
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    // Force service worker update
    self.skipWaiting();
  }
});

async function queueTransaction(transaction) {
  // Placeholder for queuing transaction
  console.log('[SW] Queuing transaction for sync:', transaction);
  
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register('background-sync-transactions');
      console.log('[SW] Background sync registered for transactions');
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error.message);
    }
  }
}

async function queueProfileUpdate(update) {
  // Placeholder for queuing profile update
  console.log('[SW] Queuing profile update for sync:', update);
  
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register('background-sync-profile');
      console.log('[SW] Background sync registered for profile');
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error.message);
    }
  }
}