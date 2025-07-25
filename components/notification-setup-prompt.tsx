"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, X } from "lucide-react"
import { 
  requestNotificationPermission, 
  getUserNotificationSettings, 
  getNotificationPermission,
  saveFCMToken
} from "@/lib/fcm"
import { useAuth } from "@/lib/useAuth"

export function NotificationSetupPrompt() {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!user?.uid || dismissed) return

      // ローカルストレージから以前に却下されたかチェック
      const dismissedKey = `notification-prompt-dismissed-${user.uid}`
      if (localStorage.getItem(dismissedKey)) {
        return
      }

      // 現在の許可状態をチェック
      const browserPermission = getNotificationPermission()
      
      if (browserPermission === 'denied') {
        // 拒否されている場合は表示しない
        return
      }

      if (browserPermission === 'default') {
        // まだ許可を求めていない場合は表示
        setShowPrompt(true)
        return
      }

      // 許可されている場合は、トークンが保存されているかチェック
      if (browserPermission === 'granted') {
        const settings = await getUserNotificationSettings(user.uid)
        if (!settings.hasToken) {
          // 許可はされているがトークンがない場合は表示
          setShowPrompt(true)
        }
      }
    }

    checkNotificationStatus()
  }, [user?.uid, dismissed])

  const handleEnableNotifications = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      const token = await requestNotificationPermission()
      if (token) {
        await saveFCMToken(user.uid, token, true)
        setShowPrompt(false)
        console.log("✅ 通知設定完了")
      } else {
        console.log("❌ 通知許可が拒否されました")
      }
    } catch (error) {
      console.error("通知設定エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    if (!user?.uid) return
    
    // ローカルストレージに却下フラグを保存（1週間）
    const dismissedKey = `notification-prompt-dismissed-${user.uid}`
    const dismissedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000 // 1週間後
    localStorage.setItem(dismissedKey, dismissedUntil.toString())
    
    setShowPrompt(false)
    setDismissed(true)
  }

  if (!showPrompt || !user) {
    return null
  }

  return (
    <Card className="mx-4 mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-blue-600" />
            通知を有効にしませんか？
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          新しいメッセージや取引の更新をリアルタイムで受け取れます。
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handleEnableNotifications}
            disabled={isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                設定中...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                通知を有効にする
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDismiss}
            className="flex items-center gap-2"
          >
            <BellOff className="h-4 w-4" />
            後で設定する
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}