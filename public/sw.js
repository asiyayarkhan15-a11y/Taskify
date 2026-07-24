// Taskify service worker — makes the app installable and works offline.
const CACHE = "taskify-v1";
const ASSETS = [
  "/login.html", "/signup.html", "/index.html", "/tasks.html", "/calendar.html", "/profile.html",
  "/style.css", "/auth.css",
  "/app.js", "/auth.js", "/guard.js", "/calendar.js", "/profile.js",
  "/manifest.json", "/icon-192.png", "/icon-512.png", "/icon-180.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Never cache API/auth calls — always go to the network for fresh, authed data.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Page navigations: try network first (so updates show), fall back to cache offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((c) => c || caches.match("/login.html"))));
    return;
  }

  // Static assets: serve from cache first, otherwise fetch and cache.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});
