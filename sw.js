// Service Worker del "shell" de OxoLegal.
// Objetivo: permitir instalación como PWA (ícono nativo + modo standalone sin badge de navegador).
// NO cachea el contenido real (vive en el iframe de Apps Script,
// requiere red y sesión de Google activa, así que no tiene sentido cachearlo).
const CACHE_NAME = 'oxolegal-shell-v1';
const SHELL_ASSETS = ['./', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo intervenimos la navegación al shell mismo (esta página).
  // Todo lo demás (llamadas dentro del iframe de Apps Script) pasa directo a red.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./'))
    );
  }
});
