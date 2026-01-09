// Service Worker for Employee Tracker
const CACHE_NAME = 'employee-tracker-v2';
const OFFLINE_QUEUE = 'offline-locations';

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './js/app.js',
                './icon.png',
                './manifest.json'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // For same-origin requests, try cache first
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});

// Background Sync for Firebase data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-locations') {
        console.log('[Service Worker] Background sync triggered');
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    // Get clients and notify them to sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_OFFLINE_DATA',
            timestamp: new Date().toISOString()
        });
    });
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SAVE_OFFLINE_LOCATION') {
        saveToQueue(event.data.location);
    }
});

// Store offline data in IndexedDB or return a fallback
async function saveToQueue(locationData) {
    // Simple localStorage fallback since IndexedDB is complex
    console.log('[Service Worker] Would save offline:', locationData);
    return Promise.resolve();
}

// Periodic Background Sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'location-update') {
            console.log('[Service Worker] Periodic sync');
            event.waitUntil(notifyAppForUpdate());
        }
    });
}

async function notifyAppForUpdate() {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'PERIODIC_UPDATE',
            time: new Date().toISOString()
        });
    });
}// Service Worker File
