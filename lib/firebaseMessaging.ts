import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// ブラウザ環境でのみFirebase Messagingを初期化
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BPLjhnpJHUF04RUG5fPbb62j9N4AFn6yh4fBCeIwaGq_efPSfPxnkaqyb0d630bkyX8HOXeIL8BVAR4NiNlMlu4';

export const requestNotificationPermission = async (): Promise<string | null> => {
  // ブラウザ環境チェック
  if (typeof window === 'undefined' || !messaging) {
    console.log('ブラウザ環境ではありません');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('通知権限が許可されました');
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
        
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        console.log('FCM Token:', token);
        return token;
      }
    } else {
      console.log('通知権限が拒否されました');
    }
  } catch (error) {
    console.error('通知権限の取得に失敗しました:', error);
  }
  
  return null;
};

export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'fcmTokens', userId), {
      token,
      updatedAt: new Date()
    });
    console.log('FCMトークンを保存しました');
  } catch (error) {
    console.error('FCMトークンの保存に失敗しました:', error);
  }
};

export const getFCMToken = async (userId: string): Promise<string | null> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'fcmTokens', userId));
    if (tokenDoc.exists()) {
      return tokenDoc.data().token;
    }
  } catch (error) {
    console.error('FCMトークンの取得に失敗しました:', error);
  }
  return null;
};

export const setupForegroundMessageHandler = () => {
  // ブラウザ環境チェック
  if (typeof window === 'undefined' || !messaging) {
    console.log('ブラウザ環境ではありません');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('フォアグラウンドでメッセージを受信:', payload);
    
    if (payload.notification) {
      const { title, body } = payload.notification;
      
      new Notification(title || 'uniTex', {
        body: body || '新しいメッセージがあります',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-message'
      });
    }
  });
};