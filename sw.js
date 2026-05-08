const CACHE_NAME = 'anykan-cache-v1';

// Install the service worker
self.addEventListener('install', event => {
    self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim()); // Become available to all pages
});

// Minimal fetch listener required for PWA installation
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});