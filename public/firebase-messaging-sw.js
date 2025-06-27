// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

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

// バックグラウンドメッセージの処理
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || '新着メッセージ';
  const notificationOptions = {
    body: payload.notification.body || 'メッセージが届きました',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-message',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'メッセージを見る'
      }
    ],
    data: {
      url: payload.data?.url || '/messages'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/messages';
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // 既に開いているタブがあるかチェック
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // 新しいタブを開く
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});