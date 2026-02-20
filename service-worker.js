/* OH11 Field Hub - Service Worker
   Offline app shell (UI loads even without signal).
*/

const CACHE_NAME = "oh11-links-v4"; // ✅ bump version when you update
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
  // add icons here if you have them:
  // "./icon-192.png",
  // "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only cache same-origin assets (your PWA files)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});