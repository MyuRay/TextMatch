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

// バックグラウンドメッセージ（全ての通知）の処理
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received message ', payload);
  console.log('[firebase-messaging-sw.js] Visibility state:', document?.visibilityState || 'unknown');
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'TextMatch';
  const notificationTag = `textmatch-${payload.data?.type || 'notification'}-${payload.data?.conversationId || payload.data?.bookId || payload.data?.recipientId || 'general'}`;
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '新しい通知があります', 
    icon: '/logo.png',
    badge: '/logo.png',
    tag: notificationTag, // 関連IDベースで重複防止
    requireInteraction: false, // 自動で閉じるように変更
    actions: [
      {
        action: 'open',
        title: '開く'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ],
    data: payload.data || {}
  };

  console.log('[firebase-messaging-sw.js] Showing notification with tag:', notificationTag);
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // 開くURLを決定
  const data = event.notification.data || {};
  const urlToOpen = getUrlToOpen(data);
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // 既に開いているタブがあるかチェック
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            if (urlToOpen !== self.location.origin) {
              client.navigate(urlToOpen);
            }
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

// 通知データから開くURLを決定
function getUrlToOpen(data) {
  const baseUrl = self.location.origin;
  
  if (data.actionUrl) {
    return `${baseUrl}${data.actionUrl}`;
  }
  
  if (data.conversationId) {
    return `${baseUrl}/messages/${data.conversationId}`;
  }
  
  if (data.bookId) {
    return `${baseUrl}/marketplace/${data.bookId}`;
  }
  
  if (data.url) {
    return `${baseUrl}${data.url}`;
  }
  
  return `${baseUrl}/notifications`;
}