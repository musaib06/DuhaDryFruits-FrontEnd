/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications
 *
 * NOTE: This file lives in `public/` so the production build copies it to the
 * web root and the SSR server serves it as `application/javascript`. If it is
 * placed under `src/` it is not emitted to the build output and the SSR server
 * returns index.html for it (text/html), which breaks SW registration.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase with config from environment
// These will be replaced during build process
const firebaseConfig = {
  apiKey: "AIzaSyATpeXmdGLK4y40ljotQ9ZVyqkB0tblQLM",
  authDomain: "wild-valley-4c7a5.firebaseapp.com",
  projectId: "wild-valley-4c7a5",
  storageBucket: "wild-valley-4c7a5.firebasestorage.app",
  messagingSenderId: "943411759123",
  appId: "1:943411759123:web:41437dac8a4cb540bf97e6",
  measurementId: "G-PCPQVPF9K3"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

/**
 * Handle background push messages
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Wild Valley Foods';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: payload.data?.tag || 'default',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'View Order'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click.
 * Resolves the deep-link target and, where possible, focuses an already-open
 * tab and asks it to navigate via the Angular Router (avoids a full reload).
 * Otherwise opens a new window at the target URL.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const data = event.notification.data || {};

  // Click target precedence: explicit url/click_action → product → homepage.
  let url = '/';
  if (data.url) {
    url = data.url;
  } else if (data.click_action) {
    url = data.click_action;
  } else if (data.productId) {
    url = `/product/${data.productId}`;
  } else if (data.orderId) {
    url = `/orders/${data.orderId}`;
  }

  // Normalise to a same-origin path for router navigation when possible.
  let pathForRouter = url;
  try {
    if (/^https?:\/\//i.test(url)) {
      const parsed = new URL(url);
      if (parsed.origin === self.location.origin) {
        pathForRouter = parsed.pathname + parsed.search + parsed.hash;
      }
    }
  } catch (e) {
    pathForRouter = url;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: pathForRouter });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
        return undefined;
      })
  );
});

/**
 * Handle push event (for non-Firebase push)
 */
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push received:', event);

  if (event.data) {
    const data = event.data.json();

    const title = data.title || 'Wild Valley Foods';
    const options = {
      body: data.body || '',
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: data.tag || 'default',
      data: data
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

/**
 * Handle service worker install
 */
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing');
  self.skipWaiting();
});

/**
 * Handle service worker activate
 */
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating');
  event.waitUntil(self.clients.claim());

  // Notify clients that SW is active
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_ACTIVATED' });
    });
  });
});

/**
 * Handle messages from client
 */
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message from client:', event.data);

  if (event.data && event.data.type === 'GET_TOKEN') {
    // Get FCM token
    messaging.getToken().then(token => {
      event.source.postMessage({
        type: 'FCM_TOKEN',
        token: token
      });
    }).catch(err => {
      console.error('Failed to get FCM token:', err);
    });
  }
});
