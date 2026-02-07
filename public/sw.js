const CACHE_BUCKET = 'app-cache';

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_BUCKET)
			.then((cache) => cache.add('/index.html'))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) return cachedResponse;

			return fetch(event.request).then((networkResponse) => {
				if (networkResponse && networkResponse.ok) {
					const responseToCache = networkResponse.clone();

					caches.open(CACHE_BUCKET).then((cache) => {
						cache.put(event.request, responseToCache);
					});
				}

				return networkResponse;
			});
		})
	);
});
