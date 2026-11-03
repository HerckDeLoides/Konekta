
const CACHE_NAME = "konekta-pwa-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

// Instalar a nova versão
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Apagar as caches antigas
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter(name =>
          name.startsWith("konekta-pwa-") &&
          name !== CACHE_NAME
        )
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

// Carregar sempre a versão mais recente da página
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Não interferir com serviços externos
  if (url.origin !== self.location.origin) return;

  // Para páginas HTML, consultar primeiro a internet
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, {
          cache: "no-store"
        });

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./index.html", response.clone());
        }

        return response;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);

        return (
          await cache.match("./index.html")
        ) || Response.error();
      }
    })());

    return;
  }

  // Para outros ficheiros, usar a rede e guardar cópias
  event.respondWith((async () => {
    try {
      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);

      return (
        await cache.match(request)
      ) || Response.error();
    }
  })());
});
        
