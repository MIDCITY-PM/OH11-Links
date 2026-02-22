/* service-worker.js
   OH11 Field Hub - Offline App Shell + Robust Cache Handling
   Author: Enrique Torres

   Notes:
   - This service worker caches only your PWA files (same-origin).
   - External sites (Google/Procore/Autodesk/OpenSpace) are NOT cached here.
   - Bump CACHE_NAME when you update index/manifest/icons to force phones to refresh.
*/

const CACHE_NAME = "oh11-links-v7"; // ✅ change to v8, v9... whenever you deploy updates

// Cache only your app shell (files hosted on GitHub Pages)
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
  // If you have icons in the repo, uncomment:
  // "./icon-192.png",
  // "./icon-512.png"
];

// INSTALL: Pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH: Serve cached shell files; fallback to network; offline fallback to cached index.html
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only cache/serve same-origin assets (your GitHub Pages domain)
  if (url.origin !== self.location.origin) return;

  // For navigation requests (opening the app), use cache-first with offline fallback
  const isNavigation =
    req.mode === "navigate" ||
    (req.destination === "document") ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Update cache with fresh index/html when online
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // For static assets (css/js/images), cache-first then network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // Cache successful same-origin responses
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached); // if both fail, return whatever we had (likely undefined)
    })
  );
});