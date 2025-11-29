// Firebase Service Worker for background push notifications
// Handles push notifications when the app is not in foreground

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: self.registration.scope.includes('localhost') 
    ? 'PLACEHOLDER_FOR_LOCAL_DEV'
    : 'YOUR_FIREBASE_API_KEY',
  projectId: 'YOUR_FIREBASE_PROJECT_ID',
  messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID'
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage(function(payload) {
  console.log('Background notification received:', payload);

  const notificationTitle = payload.notification?.title || 'Notificação';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova mensagem',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: payload.notification?.badge || '/badge-72x72.png',
    tag: 'fcm-notification',
    requireInteraction: false,
    data: payload.data || {}
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Get data from notification
  const data = event.notification.data || {};
  const action = data.action || 'openApp';

  // Determine URL to open based on action
  let urlToOpen = '/';
  
  if (action === 'openOrder' && data.orderId) {
    urlToOpen = `/driver/orders/${data.orderId}`;
  } else if (action === 'trackOrder' && data.orderId) {
    urlToOpen = `/customer/orders/${data.orderId}`;
  }

  // Check if app is already open
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If app window is open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If app not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
