/* service-worker.js
   OH-11 Field Hub - Offline App Shell + Robust Cache Handling
*/

const CACHE_NAME = "oh11-links-v10"; // ✅ bump this whenever you update assets

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(
      APP_SHELL.map(async (path) => {
        try {
          const req = new Request(path, { cache: "reload" });
          const res = await fetch(req);
          if (!res.ok) throw new Error(`${path} -> ${res.status}`);
          await cache.put(req, res);
        } catch (e) {
          console.warn("SW precache failed:", e);
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    req.mode === "navigate" ||
    req.destination === "document" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put("./index.html", fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});