const CACHE_NAME = 'neon-blackjack-v1';
const urlsToCache = [
    './',
    'index.html',
    'manifest.json',
    // The icon files will be added here once they are generated and saved
    'icon-192.png', 
    'icon-512.png',
    'icon-maskable.png'
];

// Install event: caches all necessary assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and added all resources');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event: serves cached content when offline
self.addEventListener('fetch', (event) => {
    // We only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a stream and can only be consumed once
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response because it's a stream and the browser needs one copy
                        // and the cache needs another.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Don't cache API calls or external assets (like CDNs)
                                if (event.request.url.startsWith(self.location.origin)) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    }
                ).catch((error) => {
                    // This handles network errors
                    console.error('Fetching failed:', error);
                });
            })
    );
});

// Activate event: deletes old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});