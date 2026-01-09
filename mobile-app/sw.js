// Service Worker for background sync
const CACHE_NAME = 'employee-tracker-v1';
const OFFLINE_QUEUE = 'offline-locations-queue';

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/styles.css',
                '/js/app.js',
                '/icon.png'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Background Sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-locations') {
        console.log('Background sync triggered');
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    // Get offline locations from IndexedDB or localStorage
    // This would sync when device comes back online
    console.log('Syncing offline data...');
    
    // Post message to main app to trigger sync
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_OFFLINE_DATA'
            });
        });
    });
}

// Periodic background sync (requires PWA installation)
if ('periodicSync' in self.registration) {
    try {
        await self.registration.periodicSync.register('location-sync', {
            minInterval: 15 * 60 * 1000, // 15 minutes
        });
        console.log('Periodic sync registered');
    } catch (error) {
        console.log('Periodic sync failed:', error);
    }
}