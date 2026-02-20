/* OH11 Links - Service Worker (PWA)
   Basic offline cache for app shell.
   Note: external links (Google/Openspace/Rhumbix) won't be cached due to CORS/auth.
*/

const CACHE_NAME = "oh11-links-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
  // Add icons if you create them:
  // "./icon-192.png",
  // "./icon-512.png"
];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local files, network for everything else
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin (your PWA files). External URLs go to network.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});