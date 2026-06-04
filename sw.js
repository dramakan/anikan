const CACHE_NAME = 'anykan-cache-v1';

// Install the service worker
self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// Fetch listener: bypass SW for API/localhost calls and requests that
// explicitly opt-out with X-SW-Bypass header.  This eliminates the
// "Failed to convert value to 'Response'" error caused by
// caches.match() returning undefined for uncached API URLs.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip: non-GET, localhost/127.0.0.1 (Kuhi API), Firefox signalling,
    // Firebase/Firestore (stops net::ERR_FAILED console noise),
    // or any request that explicitly sets X-SW-Bypass.
    const isApiCall =
        url.hostname === '127.0.0.1' ||
        url.hostname === 'localhost' ||
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        event.request.headers.get('X-SW-Bypass') === '1' ||
        event.request.method !== 'GET';

    if (isApiCall) {
        // Do NOT call event.respondWith() — let the browser handle it natively.
        return;
    }

    // For everything else: network-first, fall back to cache.
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Only cache valid same-origin/cors responses
                if (
                    response &&
                    response.status === 200 &&
                    (response.type === 'basic' || response.type === 'cors')
                ) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(event.request);
                // Return cached response if available, or a proper fallback
                // Response object — never return undefined/null to respondWith().
                return cached || new Response('Network error – resource not cached.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});