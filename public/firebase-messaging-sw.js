importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC_BZ8GMrkloaa-kfnFBZA9m3_5FP9AXEg",
  authDomain: "unitext-8181a.firebaseapp.com",
  projectId: "unitext-8181a",
  storageBucket: "unitext-8181a.firebasestorage.app",
  messagingSenderId: "516258091843",
  appId: "1:516258091843:web:035f412a330c36c14bd5f6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-message',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'メッセージを見る'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/messages')
    );
  }
});