// Service Worker de "Llama a Jhon" — cachea los archivos de la app para que
// abra sin internet, pero NUNCA intercepta las llamadas a Google Apps Script
// (ahí vive la base de datos real, esas siempre deben ir directo a la red).

const CACHE_NAME = 'llama-a-jhon-v1';
const ARCHIVOS_A_CACHEAR = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_A_CACHEAR))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Nunca cachear ni interceptar Google Apps Script / Google APIs — esas
  // llamadas siempre deben ir en vivo a la red (ahí están tus datos reales).
  if (url.includes('script.google.com') || url.includes('googleapis.com') || url.includes('googleusercontent.com')) {
    return; // deja que el navegador la maneje normal, sin pasar por el cache
  }

  // Para lo demás (el HTML, el manifest, los íconos): primero intenta la
  // red (para traer siempre lo más nuevo); si no hay internet, usa el cache.
  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(event.request))
  );
});
