"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Bell, BellOff } from "lucide-react"
import { requestNotificationPermission } from "@/lib/fcm"

export default function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // PWAまたはスタンドアローンモードで実行されているかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isPWA = (window.navigator as any).standalone || isStandalone

    // 通知がサポートされているかチェック
    const isNotificationSupported = 'Notification' in window

    if (!isNotificationSupported) {
      return
    }

    // 現在の通知許可状態をチェック
    const currentPermission = Notification.permission

    // 既に許可済みまたは拒否済みの場合は表示しない
    if (currentPermission !== 'default') {
      return
    }

    // ローカルストレージで表示履歴をチェック
    const hasShownPrompt = localStorage.getItem('notification-permission-prompted')
    const dismissCount = parseInt(localStorage.getItem('notification-dismiss-count') || '0')
    const lastShown = localStorage.getItem('notification-last-shown')
    const now = new Date().getTime()
    const threeDays = 3 * 24 * 60 * 60 * 1000 // 3日

    // 3回以上却下されていない、かつ最後に表示してから3日経過している場合
    if (dismissCount < 3 && (!lastShown || now - parseInt(lastShown) > threeDays)) {
      // PWAまたは初回アクセスの場合は2秒後、それ以外は5秒後（AddToHomeScreenの後）
      const delay = isPWA || !hasShownPrompt ? 2000 : 5000
      setTimeout(() => setShowPrompt(true), delay)
      
      if (!hasShownPrompt) {
        localStorage.setItem('notification-permission-prompted', 'true')
      }
    }
  }, [])

  const handleAllowNotifications = async () => {
    setIsLoading(true)
    try {
      const token = await requestNotificationPermission()
      if (token) {
        console.log("通知許可が取得されました - Token:", token)
        setShowPrompt(false)
        localStorage.setItem('notification-last-shown', new Date().getTime().toString())
      } else {
        console.log("通知許可が拒否されました")
        handleDismiss()
      }
    } catch (error) {
      console.error("通知許可取得エラー:", error)
      handleDismiss()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    const dismissCount = parseInt(localStorage.getItem('notification-dismiss-count') || '0')
    localStorage.setItem('notification-dismiss-count', (dismissCount + 1).toString())
    localStorage.setItem('notification-last-shown', new Date().getTime().toString())
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm mx-auto animate-in slide-in-from-bottom duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              通知を有効にする
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
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              新しいメッセージや重要な更新をリアルタイムで受け取るために、通知を有効にしませんか？
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="h-3 w-3" />
                <span>新しいメッセージの通知</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="h-3 w-3" />
                <span>取引完了や重要な更新</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleAllowNotifications} 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>設定中...</span>
                </div>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  通知を有効にする
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDismiss} disabled={isLoading}>
              <BellOff className="mr-2 h-4 w-4" />
              後で
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            いつでも設定から変更できます
          </p>
        </CardContent>
      </Card>
    </div>
  )
}