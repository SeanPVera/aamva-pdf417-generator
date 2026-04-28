// __SW_BUILD_ID__ is replaced at build time so each release rotates the cache.
const CACHE_NAME = "aamva-pdf417-" + (self.__SW_BUILD_ID__ || "dev");

// Built-asset paths (hashed JS/CSS) are injected at build time by the
// `inject-sw-precache-manifest` Vite plugin. In development the array is
// empty and the runtime fetch handler still caches opportunistically.
const PRECACHE_MANIFEST = self.__SW_PRECACHE_MANIFEST__ || [];

const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", ...PRECACHE_MANIFEST];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Use individual put() calls so a single 404 doesn't abort the install.
      Promise.all(
        APP_SHELL.map((url) =>
          fetch(url, { cache: "reload" })
            .then((response) => (response.ok ? cache.put(url, response) : null))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("./"));
    })
  );
});
