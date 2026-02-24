// Import Firebase using compat versions for service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase configuration - REPLACE WITH YOUR OWN
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: payload.notification?.icon || '/ZChat/icon-192.png',
        badge: '/ZChat/badge-72.png',
        data: payload.data || {},
        tag: 'zchat-notification',
        renotify: true,
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Open Chat'
            },
            {
                action: 'close',
                title: 'Dismiss'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open or focus the app
    const urlToOpen = new URL('/ZChat/', self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        // Check if there's already a window focused
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // If not, open a new window
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    return self.clients.claim();
});

// Handle push events (fallback for older browsers)
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);

    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('Push data:', data);

        const options = {
            body: data.notification?.body || 'New message',
            icon: data.notification?.icon || '/ZChat/icon-192.png',
            badge: '/ZChat/badge-72.png',
            data: data.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Open'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(
                data.notification?.title || 'ZChat',
                options
            )
        );
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});
