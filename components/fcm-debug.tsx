"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  requestNotificationPermission, 
  getUserNotificationSettings, 
  toggleNotificationEnabled,
  getNotificationPermission,
  isFCMAvailable,
  sendPushNotification
} from "@/lib/fcm"
import { useAuth } from "@/lib/useAuth"

export function FCMDebugPanel() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [fcmStatus, setFcmStatus] = useState<{
    browserPermission: NotificationPermission
    fcmSupported: boolean
    hasToken: boolean
    tokenEnabled: boolean
    fcmToken: string | null
  }>({
    browserPermission: 'default',
    fcmSupported: false,
    hasToken: false,
    tokenEnabled: false,
    fcmToken: null
  })
  const [testResult, setTestResult] = useState<string>("")

  // FCM状態を取得
  const checkFCMStatus = async () => {
    if (!user?.uid) return

    try {
      const [supported, settings] = await Promise.all([
        isFCMAvailable(),
        getUserNotificationSettings(user.uid)
      ])

      setFcmStatus({
        browserPermission: getNotificationPermission(),
        fcmSupported: supported,
        hasToken: settings.hasToken,
        tokenEnabled: settings.enabled,
        fcmToken: settings.fcmToken
      })
    } catch (error) {
      console.error("FCM状態取得エラー:", error)
    }
  }

  useEffect(() => {
    checkFCMStatus()
  }, [user?.uid])

  // 通知許可要求
  const handleRequestPermission = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    setTestResult("")

    try {
      console.log("🔔 通知許可要求開始")
      const token = await requestNotificationPermission()
      
      if (token) {
        setTestResult(`✅ FCMトークン取得成功: ${token.substring(0, 50)}...`)
        await checkFCMStatus()
      } else {
        setTestResult("❌ FCMトークン取得失敗")
      }
    } catch (error) {
      console.error("通知許可要求エラー:", error)
      setTestResult(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 通知の有効/無効切り替え
  const handleToggleNotification = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    setTestResult("")

    try {
      const result = await toggleNotificationEnabled(user.uid)
      setTestResult(result ? "✅ 通知を有効にしました" : "❌ 通知を無効にしました")
      await checkFCMStatus()
    } catch (error) {
      console.error("通知切り替えエラー:", error)
      setTestResult(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // テスト通知送信
  const handleSendTestNotification = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    setTestResult("")

    try {
      console.log("📤 テスト通知送信開始")
      const success = await sendPushNotification(
        user.uid,
        "テスト通知",
        "これはFCM動作確認のためのテスト通知です",
        {
          type: "test",
          timestamp: new Date().toISOString()
        }
      )

      if (success) {
        setTestResult("✅ テスト通知送信成功")
      } else {
        setTestResult("❌ テスト通知送信失敗")
      }
    } catch (error) {
      console.error("テスト通知送信エラー:", error)
      setTestResult(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>FCMデバッグパネル</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ログインが必要です</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => (
    <Badge variant={condition ? "default" : "destructive"}>
      {condition ? trueText : falseText}
    </Badge>
  )

  const getPermissionBadge = (permission: NotificationPermission) => {
    const variants = {
      granted: "default" as const,
      denied: "destructive" as const,
      default: "secondary" as const
    }
    return <Badge variant={variants[permission]}>{permission}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>FCMデバッグパネル</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在の状態 */}
        <div className="space-y-2">
          <h3 className="font-semibold">現在の状態</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>ブラウザ許可: {getPermissionBadge(fcmStatus.browserPermission)}</div>
            <div>FCMサポート: {getStatusBadge(fcmStatus.fcmSupported, "対応", "非対応")}</div>
            <div>トークン保有: {getStatusBadge(fcmStatus.hasToken, "あり", "なし")}</div>
            <div>通知有効: {getStatusBadge(fcmStatus.tokenEnabled, "有効", "無効")}</div>
          </div>
          {fcmStatus.fcmToken && (
            <div className="text-xs font-mono bg-gray-100 p-2 rounded">
              トークン: {fcmStatus.fcmToken.substring(0, 100)}...
            </div>
          )}
        </div>

        {/* アクション */}
        <div className="space-y-2">
          <h3 className="font-semibold">テストアクション</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleRequestPermission} 
              disabled={isLoading}
              size="sm"
            >
              通知許可要求
            </Button>
            <Button 
              onClick={handleToggleNotification} 
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              通知切り替え
            </Button>
            <Button 
              onClick={handleSendTestNotification} 
              disabled={isLoading || !fcmStatus.hasToken || !fcmStatus.tokenEnabled}
              size="sm"
              variant="secondary"
            >
              テスト通知送信
            </Button>
            <Button 
              onClick={checkFCMStatus} 
              disabled={isLoading}
              size="sm"
              variant="ghost"
            >
              状態更新
            </Button>
          </div>
        </div>

        {/* 結果表示 */}
        {testResult && (
          <div className="p-3 bg-gray-50 rounded text-sm font-mono">
            {testResult}
          </div>
        )}

        {/* ロード状態 */}
        {isLoading && (
          <div className="text-center text-sm text-gray-500">
            実行中...
          </div>
        )}
      </CardContent>
    </Card>
  )
}