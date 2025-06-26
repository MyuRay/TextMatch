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
      console.log('通知許可が得られました')
      
      // FCMトークンを取得
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      })
      
      if (token) {
        console.log('FCMトークン取得成功:', token)
        return token
      } else {
        console.log('FCMトークンの取得に失敗しました')
        return null
      }
    } else {
      console.log('通知許可が拒否されました')
      return null
    }
  } catch (error) {
    console.error('通知許可要求エラー:', error)
    return null
  }
}

// フォアグラウンドメッセージの処理
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return

  return onMessage(messaging, (payload) => {
    console.log('フォアグラウンドメッセージ受信:', payload)
    callback(payload)
  })
}

// 通知表示
export const showNotification = (title: string, body: string, url?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon.png',
      tag: 'message'
    })
    
    notification.onclick = () => {
      window.focus()
      if (url) {
        window.location.href = url
      }
      notification.close()
    }
  }
}