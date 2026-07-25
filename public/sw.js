// Taskify service worker — intentionally minimal.
// It caches ONLY the app icons (so the app stays installable) and lets all
// code (HTML/CSS/JS) and API calls always come straight from the network.
// This guarantees you never get a stale/broken cached version after a deploy.
const CACHE = "taskify-v3";
const ICONS = ["/icon-192.png", "/icon-512.png", "/icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ICONS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Only the icons are served from cache; everything else is live network.
  if (e.request.method === "GET" && /\/icon-\d+\.png$/.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
  }
});
