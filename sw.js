// Service Worker for Personal Expense Tracker PWA
const CACHE_NAME = 'expense-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://accounts.google.com/gsi/client',
    'https://developers.google.com/identity/images/g-logo.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(event.request).then(
                    function(response) {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline expense storage
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        event.waitUntil(syncExpenses());
    }
});

// Sync expenses when back online
function syncExpenses() {
    return new Promise(function(resolve, reject) {
        // Get offline expenses from IndexedDB
        // This would integrate with the main app's offline storage
        resolve();
    });
}

// Push notification support
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'New expense reminder!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'add-expense',
                title: 'Add Expense',
                icon: '/icons/icon-192x192.png'
            },
            {
                action: 'view-sheet',
                title: 'View Sheet',
                icon: '/icons/icon-192x192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Expense Tracker', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'add-expense') {
        event.waitUntil(
            clients.openWindow('/?action=add')
        );
    } else if (event.action === 'view-sheet') {
        event.waitUntil(
            clients.openWindow('/?action=view')
        );
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from main app
self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
}); 