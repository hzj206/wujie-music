const STATIC_CACHE = "musehub-static-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./site.webmanifest",
  "./favicon.ico",
  "./favicon-32x32.png",
  "./apple-touch-icon.png",
  "./css/reset.css",
  "./css/variables.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/pages.css",
  "./css/polish.css",
  "./css/responsive.css",
  "./js/mock.js",
  "./js/storage.js",
  "./js/api.js",
  "./js/normalize.js",
  "./js/search-service.js",
  "./js/lyric-service.js",
  "./js/player-service.js",
  "./js/lyric.js",
  "./js/player.js",
  "./js/ui.js",
  "./js/router.js",
  "./js/main.js",
  "./assets/avatars/musehub-tv-avatar.png",
  "./assets/bg/home-hero-room.webp",
  "./assets/icons/musehub-icon-192.png",
  "./assets/icons/musehub-icon-512.png"
];
const CACHEABLE_ASSET = /\.(?:css|js|png|ico|svg|webp|json|webmanifest)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match("./index.html").then((cached) => cached || caches.match("./offline.html")))
    );
    return;
  }

  if (!CACHEABLE_ASSET.test(url.pathname)) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
