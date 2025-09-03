// Service Worker voor Ledenbeheer PWA
// Versie: 2.0.0

const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `ledenbeheer-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ledenbeheer-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `ledenbeheer-api-v${CACHE_VERSION}`;

// Bestanden die altijd gecached moeten worden
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// API endpoints die gecached mogen worden (niet verify endpoint!)
const CACHEABLE_APIS = [
  '/api/members',
  '/api/dashboard/stats',
  '/api/cards/stats',
  '/api/cards',
  '/api/tenant/current',
  '/api/card/'  // Card data can be cached with stale-while-revalidate
];

// API endpoints die NOOIT gecached mogen worden
const NO_CACHE_APIS = [
  '/api/card/verify',
  '/api/auth'
];

self.addEventListener('install', event => {
  console.log('[SW] Installing service worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Alleen GET requests verwerken
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension en andere protocollen
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets en pagina's
  event.respondWith(handleStaticRequest(request));
});

// Behandel API requests met verschillende strategieën
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Verificatie endpoint: altijd NetworkFirst (belangrijke live data)
  if (url.pathname.startsWith('/api/card/verify/')) {
    console.log('[SW] NetworkFirst for verify endpoint:', url.pathname);
    return networkFirstStrategy(request, API_CACHE);
  }
  
  // Andere no-cache API's: NetworkOnly
  if (NO_CACHE_APIS.some(api => url.pathname.startsWith(api))) {
    console.log('[SW] NetworkOnly for:', url.pathname);
    try {
      return await fetch(request);
    } catch (error) {
      console.error('[SW] Network error for no-cache API:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Geen internetverbinding',
          offline: true 
        }), 
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Cacheable API's: NetworkFirst strategie
  if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
    console.log('[SW] NetworkFirst for:', url.pathname);
    return networkFirstStrategy(request, API_CACHE);
  }

  // Andere API's: direct naar netwerk
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[SW] Network error for API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'API niet bereikbaar',
        offline: true 
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Behandel statische requests
async function handleStaticRequest(request) {
  // Voor navigatie requests: NetworkFirst met fallback naar index.html
  if (request.mode === 'navigate') {
    console.log('[SW] Navigation request:', request.url);
    return networkFirstStrategy(request, DYNAMIC_CACHE, '/');
  }

  // Voor andere static assets: CacheFirst
  return cacheFirstStrategy(request, STATIC_CACHE);
}

// NetworkFirst strategie: probeer netwerk eerst, fallback naar cache
async function networkFirstStrategy(request, cacheName, fallbackUrl = null) {
  try {
    const networkResponse = await fetch(request);
    
    // Als succesvol, update cache
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Probeer uit cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline)');
      return cachedResponse;
    }
    
    // Fallback voor navigatie
    if (fallbackUrl) {
      const fallbackResponse = await caches.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    // Geen cache beschikbaar
    throw error;
  }
}

// CacheFirst strategie: cache eerst, fallback naar netwerk
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Cache miss, fetching:', request.url);
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url, error);
    throw error;
  }
}

// Background sync voor offline acties
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  // Implementeer background sync logica hier
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nieuwe melding van Ledenbeheer',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Ledenbeheer', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

console.log('[SW] Service worker script loaded v' + CACHE_VERSION);