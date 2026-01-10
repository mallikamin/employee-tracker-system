// Simple Service Worker for GitHub Pages
const CACHE_NAME = 'employee-tracker-v1';

self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('[SW] Activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});

self.addEventListener('message', function(event) {
    console.log('[SW] Message received:', event.data);
});