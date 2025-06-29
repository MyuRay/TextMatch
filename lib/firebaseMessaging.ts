"use client"

import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { app } from "./firebaseConfig"

let messaging: any = null

// ブラウザ環境でのみFirebase Messagingを初期化
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.error('Firebase Messaging初期化エラー:', error)
  }
}

// VAPID公開鍵（Firebase Consoleで生成される）
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

// 通知許可を要求してFCMトークンを取得
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.log('Firebase Messaging が利用できません')
      return null
    }

    // 通知許可を要求
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log('通知の許可が得られました')
      
      // FCMトークンを取得
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      })
      
      if (token) {
        console.log('FCMトークン:', token)
        return token
      } else {
        console.log('FCMトークンの取得に失敗しました')
        return null
      }
    } else {
      console.log('通知の許可が得られませんでした')
      return null
    }
  } catch (error) {
    console.error('FCMトークン取得エラー:', error)
    return null
  }
}

// フォアグラウンドでのメッセージ受信を設定
export const setupForegroundMessageListener = () => {
  if (!messaging) {
    console.log('Firebase Messaging が利用できません')
    return
  }

  onMessage(messaging, (payload) => {
    console.log('フォアグラウンドでメッセージを受信:', payload)
    
    // 通知を表示
    if (payload.notification) {
      const { title, body, icon } = payload.notification
      
      if (Notification.permission === 'granted') {
        new Notification(title || '新着通知', {
          body: body || '',
          icon: icon || '/logo.png',
          tag: 'firebase-notification'
        })
      }
    }
  })
}

// FCMトークンを更新
export const refreshFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.log('Firebase Messaging が利用できません')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    })
    
    if (token) {
      console.log('FCMトークンを更新しました:', token)
      return token
    } else {
      console.log('FCMトークンの更新に失敗しました')
      return null
    }
  } catch (error) {
    console.error('FCMトークン更新エラー:', error)
    return null
  }
}