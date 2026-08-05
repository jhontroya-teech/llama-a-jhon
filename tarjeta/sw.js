// Service Worker de la TARJETA del cliente (independiente del panel admin).
// Línea 1: le "presta" este mismo worker a OneSignal para que pueda mostrar
// las notificaciones push, aunque la app esté cerrada.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Igual que el sw.js del panel: cachea los archivos de la tarjeta para que
// abra sin internet, pero nunca intercepta las llamadas a Google Apps Script
// ni a OneSignal (esas siempre deben ir directo a la red).
const CACHE_NAME = 'tarjeta-llama-a-jhon-v1';
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

  // Solo interceptamos peticiones de LECTURA (GET). Las de escritura
  // (POST, PATCH, etc. — como las que usa OneSignal para registrar tu
  // suscripción) deben pasar directo a la red, nunca por el caché.
  if (event.request.method !== 'GET') {
    return;
  }

  // Nunca cachear Google Apps Script / Google APIs / OneSignal — deben ir
  // siempre en vivo a la red.
  if (
    url.includes('script.google.com') ||
    url.includes('googleapis.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('onesignal.com')
  ) {
    return;
  }

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
