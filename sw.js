// Este service worker YA NO SE USA. Existía compitiendo con el de OneSignal
// (con un alcance /llama-a-jhon/ que tapaba al de la tarjeta), y eso impedía
// que las notificaciones push llegaran bien. Este archivo se desregistra a
// sí mismo apenas se activa, y borra cualquier caché vieja que haya dejado.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Borra cualquier caché que este worker haya creado antes
      const nombres = await caches.keys();
      await Promise.all(nombres.map((n) => caches.delete(n)));
      // Se desregistra a sí mismo
      await self.registration.unregister();
      // Recarga las pestañas que tenía bajo su control, para que
      // el navegador vuelva a elegir el service worker correcto (OneSignal)
      const clientes = await self.clients.matchAll({ type: 'window' });
      clientes.forEach((c) => c.navigate(c.url));
    })()
  );
});
