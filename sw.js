/**
 * ============================================================================
 * OXOLEGAL - SERVICE WORKER (PWA OFFLINE-FIRST)
 * ============================================================================
 * Maneja el ciclo de vida de la aplicación progresiva (PWA):
 * - Estrategia Cache First para assets estáticos (HTML, CSS, JS, media).
 * - Estrategia Network First (con fallback a caché) para consultas a la API de GAS.
 */

const CACHE_NAME = 'oxolegal-core-v1';

// Recursos esenciales que se precargan durante la instalación
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/cards.css',
  './css/modals.css',
  './css/toast.css',
  './css/skeleton.css',
  './css/responsive.css',
  './app.js',
  './js/config.js',
  './js/storage.js',
  './js/api.js',
  './js/ui.js',
  './js/views.js',
  './js/app.js',
  './manifest.json',
  './media/OxoLegal-logo.png',
  './media/OxoLegal-logo.ico'
];

/**
 * Evento 'install':
 * Abre la caché y guarda todos los archivos estáticos requeridos para uso offline.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precargando assets estáticos en la caché:', CACHE_NAME);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Error al precargar recursos:', error);
      })
  );
});

/**
 * Evento 'activate':
 * Invalida y elimina cualquier versión anterior de la caché para garantizar frescura.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('[SW] Eliminando caché obsoleta:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Evento 'fetch':
 * Aplica estrategias diferenciales de caché:
 * 1. Peticiones de API (script.google.com o action=): Network First con fallback a caché.
 * 2. Recursos estáticos locales: Cache First con fallback a la red.
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar peticiones que no sean GET (como mutaciones POST de la API)
  if (request.method !== 'GET') {
    return;
  }

  // Comprobar si la petición corresponde a la API de Google Apps Script
  const isApiRequest = url.hostname.includes('script.google.com') ||
                       url.searchParams.has('action');

  if (isApiRequest) {
    // ESTRATEGIA: Network First, fallback to cache
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si no hay red, recurrir a la respuesta almacenada previamente
          return caches.match(request);
        })
    );
  } else {
    // ESTRATEGIA: Cache First, fallback to network
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });

            return networkResponse;
          });
        })
        .catch((err) => {
          // Si falla y es navegación HTML, retornar index.html
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
          throw err;
        })
    );
  }
});
