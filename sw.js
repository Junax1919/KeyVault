// KeyVault Service Worker — v3 (force cache clear)
var CACHE = 'keyvault-v4';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// On install: cache all assets fresh
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting(); // activate immediately, don't wait
});

// On activate: DELETE all old caches (v1, v2, etc.)
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
      );
    })
  );
  self.clients.claim(); // take control of all open tabs immediately
});

// On fetch: serve from cache, fallback to network
self.addEventListener('fetch', function(e) {
  // Never cache Apps Script calls or external resources
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com') ||
      e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // Cache new resources on the fly
        var clone = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return response;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
