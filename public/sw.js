/*
 * Service-worker KILL SWITCH.
 *
 * This file used to be a next-pwa/Workbox worker, committed once as a build
 * artifact and never regenerated. next-pwa is not a dependency and nothing in
 * the app registers a worker any more — but /sw.js kept returning 200 with
 * byte-identical content, so every browser that ever installed it kept it
 * forever, serving a build that no longer exists.
 *
 * What it was doing to shoppers:
 *   - StaleWhileRevalidate on ANY .png/.jpg/.svg/.webp on ANY origin (that rule
 *     was registered before the cross-origin rule, so CDN images matched it) —
 *     old bytes painted first, the fresh copy only landed in cache for NEXT time.
 *   - /logo.svg pinned CacheFirst from a dead build's precache manifest.
 *   - StaleWhileRevalidate on all .js/.css, and NetworkFirst with a 10s timeout
 *     falling back to cached HTML — on a slow connection the whole previous
 *     build booted from cache.
 *
 * This replacement unregisters itself, deletes every cache it created, and
 * reloads open tabs onto the live build. Keep it deployed for a long time: a
 * browser only runs it when it next checks /sw.js, and an infrequent visitor
 * may not return for months. Deleting this file would 404 the update check and
 * strand those browsers on the old worker permanently.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        await caches.delete(key);
      }
      await self.registration.unregister();
      // Reload controlled tabs so they drop the cached build immediately
      // instead of waiting for the shopper to navigate.
      for (const client of await self.clients.matchAll({ type: 'window' })) {
        client.navigate(client.url);
      }
    })(),
  );
});
