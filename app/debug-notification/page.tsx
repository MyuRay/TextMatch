"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/useAuth"
import { useFCM } from "@/lib/useFCM"
import { 
  requestNotificationPermission, 
  getUserNotificationSettings,
  sendPushNotification,
  getNotificationPermission,
  isFCMAvailable
} from "@/lib/fcm"

export default function DebugNotificationPage() {
  const { user } = useAuth()
  const { isSupported, permission, isEnabled, toggleNotification } = useFCM()
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  // 1. ブラウザ対応確認
  const testBrowserSupport = async () => {
    addLog("🔍 ブラウザ対応確認開始...")
    
    const checks = {
      notification: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      fcmSupported: await isFCMAvailable()
    }
    
    addLog(`Notification API: ${checks.notification ? '✅' : '❌'}`)
    addLog(`Service Worker: ${checks.serviceWorker ? '✅' : '❌'}`)
    addLog(`FCM対応: ${checks.fcmSupported ? '✅' : '❌'}`)
    
    return Object.values(checks).every(Boolean)
  }

  // 2. 通知許可状態確認
  const testPermissionStatus = () => {
    addLog("🔍 通知許可状態確認...")
    
    const currentPermission = getNotificationPermission()
    addLog(`現在の許可状態: ${currentPermission}`)
    addLog(`許可状態詳細: ${currentPermission === 'granted' ? '✅ 許可済み' : currentPermission === 'denied' ? '❌ 拒否' : '⚠️ 未設定'}`)
    
    return currentPermission
  }

  // 3. FCMトークン取得テスト
  const testFCMToken = async () => {
    addLog("🔍 FCMトークン取得テスト...")
    setLoading(true)
    
    try {
      const token = await requestNotificationPermission()
      if (token) {
        addLog(`✅ FCMトークン取得成功: ${token.substring(0, 50)}...`)
        return token
      } else {
        addLog("❌ FCMトークン取得失敗")
        return null
      }
    } catch (error) {
      addLog(`❌ FCMトークン取得エラー: ${error}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // 4. Service Worker登録確認
  const testServiceWorker = async () => {
    addLog("🔍 Service Worker登録確認...")
    
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        addLog(`登録済みSW数: ${registrations.length}`)
        
        for (const [index, reg] of registrations.entries()) {
          addLog(`SW${index + 1}: ${reg.scope} (active: ${!!reg.active})`)
        }
        
        // Firebase Messaging SW を探す
        const fcmSW = registrations.find(reg => 
          reg.scope.includes('firebase-messaging-sw') || 
          (reg.active && reg.active.scriptURL.includes('firebase-messaging-sw'))
        )
        
        if (fcmSW) {
          addLog("✅ Firebase Messaging SW 登録済み")
          return true
        } else {
          addLog("⚠️ Firebase Messaging SW が見つかりません")
          
          // firebase-messaging-sw.js が存在するかチェック
          try {
            const response = await fetch('/firebase-messaging-sw.js')
            if (response.ok) {
              addLog("✅ firebase-messaging-sw.js ファイルは存在します")
            } else {
              addLog("❌ firebase-messaging-sw.js ファイルが見つかりません")
            }
          } catch (e) {
            addLog("❌ firebase-messaging-sw.js アクセスエラー")
          }
          
          return false
        }
      } else {
        addLog("❌ Service Worker がサポートされていません")
        return false
      }
    } catch (error) {
      addLog(`❌ Service Worker確認エラー: ${error}`)
      return false
    }
  }

  // 5. Firestore設定確認
  const testFirestoreSettings = async () => {
    if (!user) {
      addLog("❌ ユーザーがログインしていません")
      return
    }
    
    addLog("🔍 Firestore通知設定確認...")
    
    try {
      const settings = await getUserNotificationSettings(user.uid)
      addLog(`Firestore設定: ${JSON.stringify(settings)}`)
      addLog(`enabled: ${settings.enabled}, hasToken: ${settings.hasToken}`)
      
      return settings
    } catch (error) {
      addLog(`❌ Firestore設定取得エラー: ${error}`)
      return null
    }
  }

  // 6. ブラウザ通知テスト
  const testBrowserNotification = () => {
    addLog("🔍 ブラウザ通知テスト...")
    
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('🧪 テスト通知', {
          body: 'ブラウザ通知のテストです',
          icon: '/logo.png',
          tag: 'test'
        })
        
        notification.onclick = () => {
          addLog("✅ ブラウザ通知がクリックされました")
          notification.close()
        }
        
        addLog("✅ ブラウザ通知表示成功")
        return true
      } catch (error) {
        addLog(`❌ ブラウザ通知エラー: ${error}`)
        return false
      }
    } else {
      addLog("❌ 通知許可が必要です")
      return false
    }
  }

  // 7. プッシュ通知送信テスト
  const testPushNotification = async () => {
    if (!user) {
      addLog("❌ ユーザーがログインしていません")
      return
    }
    
    addLog("🔍 プッシュ通知送信テスト...")
    setLoading(true)
    
    try {
      const success = await sendPushNotification(
        user.uid,
        '🧪 プッシュ通知テスト',
        'サーバー経由のプッシュ通知テストです',
        {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      )
      
      if (success) {
        addLog("✅ プッシュ通知送信成功")
      } else {
        addLog("❌ プッシュ通知送信失敗")
      }
      
      return success
    } catch (error) {
      addLog(`❌ プッシュ通知送信エラー: ${error}`)
      return false
    } finally {
      setLoading(false)
    }
  }

  // 全テスト実行
  const runAllTests = async () => {
    setLogs([])
    addLog("🚀 プッシュ通知診断開始...")
    
    await testBrowserSupport()
    testPermissionStatus()
    await testServiceWorker()
    await testFirestoreSettings()
    testBrowserNotification()
    
    addLog("📋 基本診断完了")
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🔧 プッシュ通知診断ツール</h1>
      
      {/* 現在の状態 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>現在の状態</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>ユーザー:</span>
              <Badge variant={user ? "default" : "secondary"}>
                {user ? `${user.uid.substring(0, 8)}...` : '未ログイン'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>FCMサポート:</span>
              <Badge variant={isSupported ? "default" : "destructive"}>
                {isSupported ? '対応' : '非対応'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>通知許可:</span>
              <Badge variant={permission === 'granted' ? "default" : permission === 'denied' ? "destructive" : "secondary"}>
                {permission === 'granted' ? '許可済み' : permission === 'denied' ? '拒否' : '未設定'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>通知有効:</span>
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* テストボタン */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>診断テスト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={runAllTests} disabled={loading}>
              🔍 全体診断
            </Button>
            <Button onClick={testBrowserSupport} disabled={loading}>
              📱 ブラウザ対応確認
            </Button>
            <Button onClick={testServiceWorker} disabled={loading}>
              ⚙️ Service Worker確認
            </Button>
            <Button onClick={testFCMToken} disabled={loading}>
              🔑 FCMトークン取得
            </Button>
            <Button onClick={testBrowserNotification} disabled={loading}>
              🔔 ブラウザ通知テスト
            </Button>
            <Button onClick={testPushNotification} disabled={loading || !user}>
              📡 プッシュ通知テスト
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ログ表示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            診断ログ
            <Button variant="outline" size="sm" onClick={() => setLogs([])}>
              クリア
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">診断テストを実行してください...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}