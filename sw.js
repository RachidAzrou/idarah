// Service Worker for Digital Membership Card PWA
const CACHE_NAME = 'lidkaart-v1';
const STATIC_CACHE = 'lidkaart-static-v1';

// Cache static assets with StaleWhileRevalidate
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg'
];

// NetworkFirst strategy for verify API - offline shows NIET_ACTUEEL
const VERIFY_API_PATTERN = /\/api\/card\/verify\//;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Take control immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle verify API with NetworkFirst - offline = NIET_ACTUEEL
  if (VERIFY_API_PATTERN.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: return NIET_ACTUEEL status
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse.json().then((data) => {
                // Override status to show card is not current offline
                const offlineData = {
                  ...data,
                  status: 'NIET_ACTUEEL',
                  refreshedAt: new Date().toISOString(),
                  offline: true
                };
                return new Response(JSON.stringify(offlineData), {
                  headers: { 'Content-Type': 'application/json' }
                });
              });
            }
            
            // No cache: return offline error
            return new Response(JSON.stringify({
              error: 'Geen internetverbinding',
              status: 'NIET_ACTUEEL',
              offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle static assets with StaleWhileRevalidate
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            // Update cache with fresh response
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Network failed, return cached version if available
            return cachedResponse;
          });

          // Return cached version immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: network only for other requests
  event.respondWith(fetch(request));
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'card-refresh') {
    event.waitUntil(
      // Clear verify cache to force fresh fetch on next request
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.filter(key => VERIFY_API_PATTERN.test(key.url))
                .map(key => cache.delete(key))
          );
        });
      })
    );
  }
});

// Push notifications (if needed later)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  // Handle push notifications for card updates
});