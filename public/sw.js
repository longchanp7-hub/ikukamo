const CACHE = "ikukamo-v6";
const SCOPE = new URL(self.registration.scope);
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ikukamo-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  event.respondWith(
    fetch(event.request).then((res) => {
      const copy = res.clone();
      if (res.ok) event.waitUntil(caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => undefined));
      return res;
    }).catch(async () => (await caches.match(event.request)) || (event.request.mode === "navigate" ? await caches.match(SCOPE.href) : null) || Response.error())
  );
});
