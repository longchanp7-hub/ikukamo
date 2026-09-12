const CACHE = "ikukamo-v1";
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => { event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request))); });
