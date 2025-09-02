const CACHE_NAME = 'lidkaart-v1';
const STATIC_CACHE = 'lidkaart-static-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // NetworkOnly strategy for verify endpoint (always live)
  if (url.pathname.includes('/api/card/verify/')) {
    console.log('NetworkOnly for verify endpoint:', url.pathname);
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            ok: false,
            message: 'Verificatie niet beschikbaar offline'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // NetworkFirst strategy for Live Card pages
  if (url.pathname.startsWith('/card/') || url.pathname.includes('/api/members/')) {
    console.log('NetworkFirst for card data:', url.pathname);
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Clone the response before caching
            const responseClone = response.clone();
            
            // Only cache successful responses
            if (response.status === 200) {
              console.log('Caching fresh data for:', url.pathname);
              cache.put(event.request, responseClone);
            }
            
            return response;
          })
          .catch(() => {
            console.log('Network failed, trying cache for:', url.pathname);
            return cache.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log('Serving from cache (offline):', url.pathname);
                
                // Add offline indicator for HTML responses
                if (url.pathname.startsWith('/card/') && 
                    cachedResponse.headers.get('content-type')?.includes('text/html')) {
                  return cachedResponse.text().then((html) => {
                    const offlineHtml = html.replace(
                      '</body>',
                      `<div style="position: fixed; top: 1rem; right: 1rem; background: #f59e0b; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; z-index: 1000;">
                        📱 Momentopname - ${new Date().toLocaleString('nl-BE')}
                      </div></body>`
                    );
                    return new Response(offlineHtml, {
                      headers: cachedResponse.headers
                    });
                  });
                }
                
                return cachedResponse;
              }
              
              // Return offline fallback
              return new Response(`
                <!DOCTYPE html>
                <html lang="nl">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Offline - Digitale Lidkaart</title>
                  <style>
                    body { 
                      font-family: system-ui; 
                      text-align: center; 
                      padding: 2rem; 
                      background: #f3f4f6;
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    .offline { 
                      background: white; 
                      padding: 2rem; 
                      border-radius: 1rem; 
                      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                      max-width: 400px;
                    }
                  </style>
                </head>
                <body>
                  <div class="offline">
                    <h1>🔌 Offline</h1>
                    <p>Je bent offline en deze lidkaart is niet beschikbaar in de cache.</p>
                    <p>Controleer je internetverbinding en probeer opnieuw.</p>
                  </div>
                </body>
                </html>
              `, {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
              });
            });
          });
      })
    );
    return;
  }

  // CacheFirst strategy for static assets
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    console.log('CacheFirst for static asset:', url.pathname);
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Serving from cache:', url.pathname);
          return cachedResponse;
        }
        
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // StaleWhileRevalidate for other assets (icons, CSS, JS)
  if (url.pathname.includes('.') && !url.pathname.includes('/api/')) {
    console.log('StaleWhileRevalidate for asset:', url.pathname);
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: try network first
  console.log('Default fetch for:', url.pathname);
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  }
});