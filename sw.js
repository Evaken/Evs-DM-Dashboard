const CACHE = 'dm-dashboard-v1';

// Files to cache immediately on install
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

// Install: pre-cache local files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local files, network-first with cache fallback for CDN
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    // Cache-first: serve instantly from cache, update in background
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached => {
          const network = fetch(e.request).then(res => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
  } else {
    // Network-first for CDN (fonts, React, Babel): fall back to cache if offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
