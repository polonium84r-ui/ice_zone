/**
 * Kill-switch Service Worker.
 *
 * The previous version of this file was a cache-first Service Worker. In
 * development it served stale HTML that referenced JS/CSS chunk files from an
 * earlier dev-server run (chunk hashes change on every restart), which showed
 * up as a blank or completely unstyled page that a normal refresh could not
 * fix — the worker just kept serving the poisoned cache.
 *
 * This replacement intentionally does nothing but remove itself and any caches
 * a previous version created. Browsers that still have the old worker
 * registered call `register('/sw.js')` from the previously-cached page, which
 * makes the browser fetch THIS file, see it changed, install it, and run the
 * cleanup below — healing automatically on the next visit. After it
 * unregisters, no Service Worker controls the site and pages load normally
 * straight from the server.
 *
 * If a real offline/PWA worker is wanted later, it must be scoped to skip HTML
 * navigations in development (or be disabled entirely when NODE_ENV !== production).
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache this origin's worker ever created.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* ignore */
      }
      // Remove this worker so nothing intercepts future requests.
      try {
        await self.registration.unregister();
      } catch {
        /* ignore */
      }
      // Force every open tab to reload from the network, now un-poisoned.
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => client.navigate(client.url));
      } catch {
        /* ignore */
      }
    })()
  );
});
