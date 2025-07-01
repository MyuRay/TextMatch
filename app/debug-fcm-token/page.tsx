"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserNotificationSettings } from "@/lib/fcm"

export default function DebugFCMTokenPage() {
  const [userId, setUserId] = useState("Zx85WPThiNQtQZtbd8dawLCcpA03")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUserToken = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const settings = await getUserNotificationSettings(userId)
      setResult(settings)
      console.log("FCMトークン確認結果:", settings)
    } catch (error) {
      console.error("FCMトークン確認エラー:", error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    setUserId("QJ8p6lguz0drq4kQd8xGNzgvxVh1")
    await checkUserToken()
  }

  const testManualPushNotification = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: userId,
          title: '🧪 手動テスト通知',
          body: 'FCMトークンデバッグ用の通知です',
          data: {
            type: 'debug',
            timestamp: new Date().toISOString()
          }
        })
      })

      const result = await response.json()
      console.log("手動プッシュ通知結果:", result)
      setResult({ ...result, apiCall: true })
    } catch (error) {
      console.error("手動プッシュ通知エラー:", error)
      setResult({ error: error.message, apiCall: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">🔧 FCMトークン診断</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ユーザーのFCMトークン確認</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ユーザーID</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ユーザーIDを入力"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={checkUserToken} disabled={loading}>
              📋 FCMトークン確認
            </Button>
            <Button onClick={checkCurrentUser} disabled={loading} variant="outline">
              👤 現在のユーザー
            </Button>
            <Button onClick={testManualPushNotification} disabled={loading} variant="secondary">
              📱 手動プッシュ通知
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>結果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.fcmToken && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">FCMトークン分析:</h4>
                <ul className="text-sm space-y-1">
                  <li><strong>有効:</strong> {result.enabled ? '✅' : '❌'}</li>
                  <li><strong>トークン存在:</strong> {result.hasToken ? '✅' : '❌'}</li>
                  <li><strong>トークン長:</strong> {result.fcmToken?.length || 0} 文字</li>
                  <li><strong>トークンプレビュー:</strong> {result.fcmToken?.substring(0, 50)}...</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}