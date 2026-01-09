// Advanced Service Worker for Background Tracking
const CACHE_NAME = 'tracker-v3';
const LOCATION_QUEUE = 'location_queue';

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    self.skipWaiting(); // Activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './js/app.js',
                './icon.png'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(clients.claim()); // Take control immediately
});

// Handle background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-locations') {
        console.log('[SW] Background sync triggered');
        event.waitUntil(syncLocations());
    }
});

// Periodic background sync (15 minutes)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'periodic-location') {
        console.log('[SW] Periodic sync at:', new Date().toLocaleTimeString());
        event.waitUntil(getBackgroundLocation());
    }
});

async function getBackgroundLocation() {
    console.log('[SW] Getting background location...');
    
    // Get all clients (app tabs)
    const clients = await self.clients.matchAll();
    
    // Ask main app to get location
    clients.forEach(client => {
        client.postMessage({
            type: 'GET_BACKGROUND_LOCATION',
            timestamp: new Date().toISOString()
        });
    });
    
    return Promise.resolve();
}

async function syncLocations() {
    // Get queued locations from IndexedDB
    const locations = await getQueuedLocations();
    
    if (locations.length > 0) {
        console.log(`[SW] Syncing ${locations.length} queued locations`);
        // In real app, you'd send to server here
    }
    
    return Promise.resolve();
}

// Simple IndexedDB for queued locations
async function getQueuedLocations() {
    // Simplified - in production use IndexedDB
    return [];
}

// Handle messages from main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'QUEUE_LOCATION') {
        console.log('[SW] Received location to queue:', event.data.location);
        // Store for later sync
    }
});