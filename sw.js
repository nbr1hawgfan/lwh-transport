// LWH Transport — Service Worker
// Caches the app shell for offline/fast load
const CACHE = 'lwh-transport-v1';
const SHELL = [
  '/lwh-transport/',
  '/lwh-transport/index.html',
  '/lwh-transport/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Always fetch GAS API calls fresh — never cache them
  if (e.request.url.includes('script.google.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // Cache new shell resources
        if (e.request.url.includes('cdnjs.cloudflare.com')) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      });
    })
  );
});
