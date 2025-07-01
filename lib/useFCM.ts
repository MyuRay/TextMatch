/**
 * FCM管理用カスタムフック
 */

import { useEffect, useState } from "react"
import { useAuth } from "./useAuth"
import { 
  initializeFCM, 
  requestNotificationPermission, 
  saveFCMToken, 
  setupForegroundNotifications,
  getNotificationPermission,
  isFCMAvailable,
  getUserNotificationSettings,
  toggleNotificationEnabled
} from "./fcm"

export function useFCM() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [isEnabled, setIsEnabled] = useState(false) // 通知の有効/無効状態
  const { user } = useAuth()

  // FCMの初期化とサポート確認
  useEffect(() => {
    const initFCM = async () => {
      try {
        const supported = await isFCMAvailable()
        setIsSupported(supported)
        
        if (supported) {
          setPermission(getNotificationPermission())
          await initializeFCM()
          
          // フォアグラウンド通知を設定
          setupForegroundNotifications((payload) => {
            console.log("フォアグラウンド通知受信:", payload)
            // 必要に応じて追加の処理
          })
        }
      } catch (error) {
        console.error("FCM初期化エラー:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initFCM()
  }, [])

  // 通知許可状態を定期的にチェック
  useEffect(() => {
    if (!isSupported) return

    const checkPermission = () => {
      const currentPermission = getNotificationPermission()
      setPermission(currentPermission)
    }

    // 初回チェック
    checkPermission()

    // 5秒ごとにチェック
    const interval = setInterval(checkPermission, 5000)

    return () => clearInterval(interval)
  }, [isSupported])

  // ユーザーの通知設定を取得
  useEffect(() => {
    if (!user || !isSupported) return

    const fetchNotificationSettings = async () => {
      try {
        console.log("🔍 通知設定を取得中... ユーザーID:", user.uid)
        const settings = await getUserNotificationSettings(user.uid)
        console.log("📋 取得した通知設定:", settings)
        // ブラウザの通知許可状態もチェック
        const browserPermission = getNotificationPermission()
        const isActuallyEnabled = settings.enabled && settings.hasToken && browserPermission === 'granted'
        
        console.log("💡 isEnabled計算:", {
          enabled: settings.enabled,
          hasToken: settings.hasToken,
          browserPermission: browserPermission,
          result: isActuallyEnabled
        })
        setIsEnabled(isActuallyEnabled)
      } catch (error) {
        console.error("通知設定取得エラー:", error)
        setIsEnabled(false)
      }
    }

    fetchNotificationSettings()
  }, [user, isSupported])

  // 通知のオン/オフを切り替え
  const toggleNotification = async (): Promise<boolean> => {
    if (!user || !isSupported) {
      console.log("❌ 切り替え不可:", { user: !!user, isSupported })
      return false
    }

    try {
      console.log("🔄 通知切り替え開始...")
      const newState = await toggleNotificationEnabled(user.uid)
      console.log("✅ 切り替え完了:", newState ? 'ON' : 'OFF')
      setIsEnabled(newState)
      
      // ブラウザの許可状態も更新
      if (newState && permission !== 'granted') {
        setPermission('granted')
      }
      
      return newState
    } catch (error) {
      console.error("通知切り替えエラー:", error)
      return false
    }
  }

  // 通知許可を要求してトークンを保存（レガシー）
  const requestPermissionAndSaveToken = async (): Promise<boolean> => {
    if (!user || !isSupported) {
      return false
    }

    try {
      const token = await requestNotificationPermission()
      
      if (token) {
        await saveFCMToken(user.uid, token, true)
        setPermission('granted')
        setIsEnabled(true)
        console.log("FCM設定完了")
        return true
      }
      
      setPermission('denied')
      return false
    } catch (error) {
      console.error("FCM設定エラー:", error)
      return false
    }
  }

  return {
    isSupported,
    permission,
    isLoading,
    isEnabled,
    toggleNotification,
    requestPermissionAndSaveToken
  }
}