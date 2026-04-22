// ─── Strick'in Service Worker ─────────────────────────────────────────────
// Provides offline support with multi-strategy caching:
//   - Cache-first for static assets (JS/CSS/fonts/images)
//   - Network-first with 5s timeout + cache fallback for APIs
//   - Stale-while-revalidate for /api/products (catalog)
//   - Offline fallback page for navigations

const VERSION = 'v3.0.0';
const STATIC_CACHE = `strickin-static-${VERSION}`;
const API_CACHE = `strickin-api-${VERSION}`;
const CATALOG_CACHE = `strickin-catalog-${VERSION}`;
const PAGES_CACHE = `strickin-pages-${VERSION}`;
const ALL_CACHES = [STATIC_CACHE, API_CACHE, CATALOG_CACHE, PAGES_CACHE];

const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/manifest.json',
  '/favicon.svg',
];

const API_TIMEOUT_MS = 5000;

// ─── Install ─────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('strickin-') && !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

// ─── Helpers ─────────────────────────────────────────────────────────────
function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms),
  );
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const response = await Promise.race([
      fetch(request),
      timeoutPromise(timeoutMs),
    ]);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// ─── Fetch handler ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (besides same-origin assets)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Navigation (HTML pages): network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await Promise.race([
            fetch(request),
            timeoutPromise(API_TIMEOUT_MS),
          ]);
          if (response && response.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, response.clone()).catch(() => undefined);
          }
          return response;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline');
          if (offline) return offline;
          return new Response(
            '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Hors ligne</title></head><body><h1>Vous êtes hors ligne</h1><p>Aucune version en cache de cette page.</p></body></html>',
            { headers: { 'content-type': 'text/html; charset=utf-8' }, status: 503 },
          );
        }
      })(),
    );
    return;
  }

  // Product catalog: stale-while-revalidate
  if (url.pathname.startsWith('/api/products')) {
    event.respondWith(staleWhileRevalidate(request, CATALOG_CACHE));
    return;
  }

  // Other APIs: network-first with 5s timeout + cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request, API_CACHE, API_TIMEOUT_MS).catch(
        () =>
          new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'content-type': 'application/json' },
            status: 503,
          }),
      ),
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images): cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Next.js static chunks
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

// ─── Push notifications ──────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Strick'in", body: event.data ? event.data.text() : '' };
  }

  const title = data.title || "Strick'in";
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/favicon.svg',
    data: { url: data.url || '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
