/**
 * Firebase Cloud Messaging (FCM) 管理ライブラリ
 */

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"
import { app } from "./firebaseConfig"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "./firebaseConfig"

// FCM設定
const FCM_CONFIG = {
  // 注意: 実際のプロジェクトでは環境変数に正しいVAPIDキーを設定してください
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BPLjhnpJHUF04RUG5fPbb62j9N4AFn6yh4fBCeIwaGq_efPSfPxnkaqyb0d630bkyX8HOXeIL8BVAR4NiNlMlu4"
}

console.log("FCM設定:", {
  vapidKeyExists: !!FCM_CONFIG.vapidKey,
  vapidKeyLength: FCM_CONFIG.vapidKey.length
})

let messaging: any = null

/**
 * FCMを初期化する
 */
export async function initializeFCM() {
  try {
    // ブラウザ環境かつFCMサポート確認
    if (typeof window === 'undefined') return null
    
    const supported = await isSupported()
    if (!supported) {
      console.warn("FCM is not supported in this browser")
      return null
    }

    messaging = getMessaging(app)
    return messaging
  } catch (error) {
    console.error("FCM初期化エラー:", error)
    return null
  }
}

/**
 * 通知許可を要求してFCMトークンを取得する
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    console.log("🔔 通知許可を要求開始")
    
    // 現在の許可状態を確認
    console.log("現在の通知許可状態:", Notification.permission)
    
    // 通知許可を要求
    const permission = await Notification.requestPermission()
    console.log("許可要求結果:", permission)
    
    if (permission !== 'granted') {
      console.log("❌ 通知許可が拒否されました:", permission)
      return null
    }

    console.log("✅ 通知許可を取得しました")

    // FCMを初期化
    console.log("📱 FCMを初期化中...")
    const fcmMessaging = await initializeFCM()
    if (!fcmMessaging) {
      console.log("❌ FCM初期化に失敗しました")
      return null
    }

    console.log("✅ FCM初期化完了")

    // FCMトークンを取得
    console.log("🔑 FCMトークンを取得中...")
    console.log("使用するVAPIDキー:", FCM_CONFIG.vapidKey.substring(0, 20) + "...")
    
    const token = await getToken(fcmMessaging, {
      vapidKey: FCM_CONFIG.vapidKey
    })

    if (!token) {
      console.log("❌ FCMトークンの取得に失敗しました")
      return null
    }

    console.log("✅ FCMトークン取得成功:", token.substring(0, 50) + "...")
    return token
  } catch (error: any) {
    console.error("❌ FCMトークン取得エラー:", error)
    return null
  }
}

/**
 * ユーザーのFCMトークンをFirestoreに保存する
 */
export async function saveFCMToken(userId: string, token: string, enabled: boolean = true): Promise<void> {
  try {
    const userTokenRef = doc(db, "userTokens", userId)
    await setDoc(userTokenRef, {
      fcmToken: token,
      enabled: enabled, // 通知の有効/無効フラグ
      updatedAt: new Date(),
      platform: "web",
      vapidKey: FCM_CONFIG.vapidKey // VAPIDキーも保存して整合性確認
    }, { merge: true })

    console.log("FCMトークン保存完了:", { enabled, vapidKey: FCM_CONFIG.vapidKey.substring(0, 20) + "..." })
  } catch (error: any) {
    console.error("FCMトークン保存エラー:", error)
    throw error
  }
}

/**
 * ユーザーのFCMトークンを取得する
 */
export async function getUserFCMToken(userId: string): Promise<string | null> {
  try {
    console.log(`🔍 [getUserFCMToken] ユーザー ${userId} のFCMトークン取得開始`)
    
    const userTokenRef = doc(db, "userTokens", userId)
    const tokenDoc = await getDoc(userTokenRef)
    
    if (!tokenDoc.exists()) {
      console.log(`❌ [getUserFCMToken] ユーザー ${userId}: userTokensドキュメントが存在しません`)
      return null
    }

    const data = tokenDoc.data()
    console.log(`📋 [getUserFCMToken] ユーザー ${userId} のトークンデータ:`, {
      hasToken: !!data.fcmToken,
      enabled: data.enabled,
      updatedAt: data.updatedAt,
      platform: data.platform
    })

    // 通知が無効の場合はnullを返す
    if (data.enabled === false) {
      console.log(`❌ [getUserFCMToken] ユーザー ${userId}: 通知が無効化されています`)
      return null
    }

    const token = data.fcmToken || null
    if (token) {
      console.log(`✅ [getUserFCMToken] ユーザー ${userId}: FCMトークン取得成功`)
    } else {
      console.log(`❌ [getUserFCMToken] ユーザー ${userId}: FCMトークンが空です`)
    }

    return token
  } catch (error: any) {
    console.error(`❌ [getUserFCMToken] ユーザー ${userId} のFCMトークン取得エラー:`, error)
    return null
  }
}

/**
 * ユーザーの通知設定を取得する
 */
export async function getUserNotificationSettings(userId: string): Promise<{
  fcmToken: string | null
  enabled: boolean
  hasToken: boolean
}> {
  try {
    console.log("📖 Firestoreからユーザートークンを取得中...", userId)
    
    // 認証状態を確認
    if (!userId) {
      console.log("❌ ユーザーIDが不正です")
      throw new Error("Invalid user ID")
    }
    
    const userTokenRef = doc(db, "userTokens", userId)
    console.log("📍 ドキュメント参照作成完了")
    
    const tokenDoc = await getDoc(userTokenRef)
    console.log("📄 ドキュメント取得完了:", tokenDoc.exists())
    
    if (!tokenDoc.exists()) {
      console.log("📄 ドキュメントが存在しません - 初期値を返します")
      return {
        fcmToken: null,
        enabled: false,
        hasToken: false
      }
    }

    const data = tokenDoc.data()
    console.log("📋 取得したドキュメントデータ:", data)
    
    const result = {
      fcmToken: data.fcmToken || null,
      enabled: data.enabled !== false, // デフォルトはtrue
      hasToken: !!data.fcmToken
    }
    console.log("📊 返り値:", result)
    
    return result
  } catch (error: any) {
    console.error("❌ 通知設定取得エラー:", error)
    console.error("エラー詳細:", error?.message || "不明")
    console.error("エラー型:", error?.code || "不明")
    return {
      fcmToken: null,
      enabled: false,
      hasToken: false
    }
  }
}

/**
 * 通知の有効/無効を切り替える
 */
export async function toggleNotificationEnabled(userId: string): Promise<boolean> {
  try {
    // まずブラウザの通知許可状態をチェック
    const currentPermission = getNotificationPermission()
    
    if (currentPermission === 'denied') {
      console.log("❌ ブラウザで通知が拒否されています")
      alert("ブラウザの設定で通知が拒否されています。ブラウザの設定から通知を許可してください。")
      return false
    }
    
    const settings = await getUserNotificationSettings(userId)
    
    if (!settings.hasToken || currentPermission !== 'granted') {
      // トークンがない場合、または通知許可がない場合は新規取得
      console.log("🔄 通知許可を要求中...")
      const token = await requestNotificationPermission()
      if (!token) {
        console.log("❌ 通知許可またはトークン取得に失敗")
        return false
      }
      await saveFCMToken(userId, token, true)
      console.log("✅ 通知を有効にしました")
      return true
    } else {
      // トークンがあり、ブラウザ許可もある場合は有効/無効を切り替え
      const newEnabled = !settings.enabled
      await saveFCMToken(userId, settings.fcmToken!, newEnabled)
      console.log(`✅ 通知を${newEnabled ? '有効' : '無効'}にしました`)
      return newEnabled
    }
  } catch (error: any) {
    console.error("通知切り替えエラー:", error)
    return false
  }
}

/**
 * フォアグラウンド通知を設定する
 */
export function setupForegroundNotifications(onNotificationReceived?: (payload: any) => void) {
  if (!messaging) {
    console.warn("FCMが初期化されていません")
    return
  }

  // フォアグラウンドでメッセージを受信した時の処理
  onMessage(messaging, (payload) => {
    console.log("フォアグラウンド通知受信:", payload)

    // カスタムハンドラーがあれば実行
    if (onNotificationReceived) {
      onNotificationReceived(payload)
    }

    // フォアグラウンド時は通知表示をService Workerに任せる
    // 重複を避けるためフォアグラウンド通知は無効化
    console.log("フォアグラウンド通知は Service Worker に委譲します")
    
    // アプリ内での処理のみ実行（UI更新など）
    // 実際の通知表示はService Workerが担当
  })
}

/**
 * ブラウザ通知を表示する
 */
function showBrowserNotification(title: string, body: string, data?: any) {
  if (Notification.permission !== 'granted') {
    console.log("通知許可がありません")
    return
  }

  try {
    // 重複防止のため一意なタグを生成（同じメッセージには同じタグを使用）
    const messageId = data?.conversationId || data?.bookId || data?.recipientId || 'general'
    const uniqueTag = `textmatch-fg-${data?.type || 'notification'}-${messageId}`
    
    // 最小限のオプションでブラウザ通知を作成
    const options = {
      body: body,
      icon: '/logo.png',
      tag: uniqueTag,
      requireInteraction: false, // 自動で閉じるように
      silent: true // 音を鳴らさない（Service Workerと重複時のため）
      // actions は削除（フォアグラウンド通知では不要）
    }

    console.log("フォアグラウンド通知作成中:", { title, options })
    const notification = new Notification(title, options)

    // 通知クリック時の処理
    notification.onclick = (event) => {
      console.log("通知がクリックされました", data)
      event.preventDefault()
      notification.close()

      // データに応じてページ遷移
      if (data?.actionUrl) {
        window.open(data.actionUrl, '_blank')
      } else if (data?.conversationId) {
        window.open(`/messages/${data.conversationId}`, '_blank')
      } else {
        // デフォルトは通知ページに遷移
        window.open('/notifications', '_blank')
      }
    }

    // 自動で閉じる（5秒後）
    setTimeout(() => {
      notification.close()
    }, 5000)

    console.log("ブラウザ通知表示成功")

  } catch (error) {
    console.error("ブラウザ通知作成エラー:", error)
    // フォールバック: アラートで表示
    alert(`通知: ${title}\n${body}`)
  }
}

/**
 * プッシュ通知を送信する（サーバー側API呼び出し）
 */
export async function sendPushNotification(
  recipientId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    // 呼び出し元を特定するためのスタックトレース
    console.log("🔔 sendPushNotification 呼び出し:", {
      recipientId,
      title,
      body,
      data,
      stack: new Error().stack?.split('\n').slice(1, 4) // 呼び出し元の3行を表示
    })

    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientId,
        title,
        body,
        data
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ プッシュ通知API失敗:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorBody: errorText
      })
      throw new Error(`プッシュ通知送信失敗: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ プッシュ通知送信成功:", result)
    return true
  } catch (error: any) {
    console.error("❌ プッシュ通知送信エラー:", error)
    return false
  }
}

/**
 * 通知許可状態を確認する
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default'
  }
  return Notification.permission
}

/**
 * FCMが利用可能かチェックする
 */
export async function isFCMAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    return await isSupported()
  } catch (error: any) {
    return false
  }
}