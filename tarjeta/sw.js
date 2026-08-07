// Este service worker quedó OBSOLETO — ahora OneSignal usa su propio
// "trabajador" en la raíz del dominio (ver /OneSignalSDKWorker.js).
// Si este archivo sigue registrado en el navegador de alguien (de pruebas
// viejas), su alcance más específico ("/llama-a-jhon/tarjeta/") le está
// ganando al de OneSignal en la raíz — y por eso nunca se mostraba el push
// en esos dispositivos. Este código hace que se autodestruya solo la
// próxima vez que se active, dejando el camino libre para que el worker
// de OneSignal (en la raíz) sea el único que controle la tarjeta.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Borra cualquier caché que haya dejado la versión vieja.
      const nombres = await caches.keys();
      await Promise.all(nombres.map((n) => caches.delete(n)));

      // Se desregistra a sí mismo.
      await self.registration.unregister();

      // Refresca cualquier pestaña abierta de la tarjeta, para que en el
      // siguiente intento de carga ya no haya ningún worker aquí, y el de
      // la raíz (OneSignal) tome el control limpio.
      const clientes = await self.clients.matchAll({ type: 'window' });
      clientes.forEach((cliente) => cliente.navigate(cliente.url));
    })()
  );
});
