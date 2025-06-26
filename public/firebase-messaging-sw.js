// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Firebase設定を初期化
// 注意: 本番環境では環境変数から動的に設定してください
const firebaseConfig = {
  apiKey: "AIzaSyBXxxxxxxxxxxxxxxxxxxxxxxxxxxx", // 実際のAPIキーに置き換え
  authDomain: "your-project.firebaseapp.com", // 実際のドメインに置き換え
  projectId: "your-project-id", // 実際のプロジェクトIDに置き換え
  storageBucket: "your-project.appspot.com", // 実際のストレージバケットに置き換え
  messagingSenderId: "123456789", // 実際のSender IDに置き換え
  appId: "1:123456789:web:xxxxxxxxxxxxxx" // 実際のApp IDに置き換え
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// バックグラウンドメッセージの処理
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || '新着メッセージ';
  const notificationOptions = {
    body: payload.notification.body || 'メッセージが届きました',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'message',
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
});