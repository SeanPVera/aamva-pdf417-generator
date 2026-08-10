// __SW_BUILD_ID__ is replaced at build time so each release rotates the cache.
const CACHE_NAME = "aamva-pdf417-" + (self.__SW_BUILD_ID__ || "dev");

// Built-asset paths (hashed JS/CSS) are injected at build time by the
// `inject-sw-precache-manifest` Vite plugin. In development the array is
// empty and the runtime fetch handler still caches opportunistically.
const PRECACHE_MANIFEST = self.__SW_PRECACHE_MANIFEST__ || [];

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  ...PRECACHE_MANIFEST
];

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

// Navigations go network-first so a redeploy reaches installed clients on the
// next launch. An iOS Home Screen app has no reload button and no way to
// bypass the cache, so serving a cached shell first would strand it on an old
// build until the browser happened to re-check sw.js. The cached shell is
// still the fallback, which is what keeps the app usable offline.
function handleNavigation(request) {
  return fetch(request)
    .then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", clone));
      return response;
    })
    .catch(() =>
      caches
        .match(request)
        .then((cached) => cached || caches.match("./index.html"))
        .then((cached) => cached || caches.match("./"))
    );
}

// Everything else is cache-first: asset URLs are content-hashed, so a cache
// hit is always the right answer and never needs revalidation.
function handleAsset(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request)
      .then((response) => {
        // Only same-origin, successful, non-opaque responses are worth
        // storing; an opaque cross-origin response can't be inspected and
        // would pin an unverifiable body in the offline cache.
        if (response.ok && response.type !== "opaque") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match("./index.html"));
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Let the network handle anything off-origin. This app makes no external
  // requests by design, so a cross-origin GET here is not ours to cache.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(request.mode === "navigate" ? handleNavigation(request) : handleAsset(request));
});
