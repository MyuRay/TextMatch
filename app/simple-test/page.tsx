"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimpleTestPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const testFirebaseConfig = () => {
    addLog("🔍 Firebase設定確認開始...")
    
    // 環境変数チェック
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    
    addLog(`API Key: ${config.apiKey ? '✅ 設定済み' : '❌ 未設定'}`)
    addLog(`Auth Domain: ${config.authDomain ? '✅ 設定済み' : '❌ 未設定'}`)
    addLog(`Project ID: ${config.projectId ? '✅ 設定済み' : '❌ 未設定'}`)
    addLog(`Storage Bucket: ${config.storageBucket ? '✅ 設定済み' : '❌ 未設定'}`)
    addLog(`Messaging Sender ID: ${config.messagingSenderId ? '✅ 設定済み' : '❌ 未設定'}`)
    addLog(`App ID: ${config.appId ? '✅ 設定済み' : '❌ 未設定'}`)
    
    // 詳細な値も表示
    Object.entries(config).forEach(([key, value]) => {
      if (value) {
        addLog(`${key}: ${value.substring(0, 20)}...`)
      }
    })
  }

  const testFirebaseImport = async () => {
    addLog("🔍 Firebase インポートテスト...")
    
    try {
      const { auth } = await import("@/lib/firebaseConfig")
      addLog("✅ firebaseConfig インポート成功")
      addLog(`Auth オブジェクト: ${auth ? '✅ 存在' : '❌ 未定義'}`)
      
      if (auth) {
        addLog(`Auth app: ${auth.app ? '✅ 存在' : '❌ 未定義'}`)
        addLog(`Auth config: ${auth.config ? '✅ 存在' : '❌ 未定義'}`)
      }
    } catch (error) {
      addLog(`❌ firebaseConfig インポートエラー: ${error}`)
    }
    
    try {
      const { loginUser } = await import("@/lib/firebaseAuth")
      addLog("✅ firebaseAuth インポート成功")
      addLog(`loginUser 関数: ${typeof loginUser}`)
    } catch (error) {
      addLog(`❌ firebaseAuth インポートエラー: ${error}`)
    }
  }

  const testManualLogin = async () => {
    addLog("🔍 手動ログインテスト...")
    
    try {
      // Firebase直接インポート
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebaseConfig")
      
      addLog("Firebase関数とauth取得完了")
      
      // テスト用メールアドレス（存在しないもの）
      const testEmail = "test@test.com"
      const testPassword = "testtest"
      
      addLog(`ログイン試行: ${testEmail}`)
      
      const result = await signInWithEmailAndPassword(auth, testEmail, testPassword)
      addLog(`✅ ログイン成功: ${result.user.email}`)
      
    } catch (error: any) {
      addLog(`ログインエラー詳細:`)
      addLog(`- エラーコード: ${error.code}`)
      addLog(`- エラーメッセージ: ${error.message}`)
      
      // よくあるエラーの解説
      if (error.code === 'auth/user-not-found') {
        addLog("→ このメールアドレスは登録されていません")
      } else if (error.code === 'auth/wrong-password') {
        addLog("→ パスワードが間違っています")
      } else if (error.code === 'auth/invalid-email') {
        addLog("→ メールアドレスの形式が無効です")
      } else if (error.code === 'auth/network-request-failed') {
        addLog("→ ネットワークエラーまたはFirebase接続問題")
      } else {
        addLog("→ その他のエラー（設定問題の可能性）")
      }
    }
  }

  const testUserRegistration = async () => {
    addLog("🔍 新規ユーザー登録テスト...")
    
    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebaseConfig")
      
      const testEmail = `test${Date.now()}@example.com`
      const testPassword = "testpassword123"
      
      addLog(`新規登録試行: ${testEmail}`)
      
      const result = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      addLog(`✅ 新規登録成功: ${result.user.email}`)
      addLog(`UID: ${result.user.uid}`)
      
      // すぐにログアウト
      await result.user.delete()
      addLog("テストユーザーを削除しました")
      
    } catch (error: any) {
      addLog(`新規登録エラー:`)
      addLog(`- エラーコード: ${error.code}`)
      addLog(`- エラーメッセージ: ${error.message}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🔧 Firebase 接続診断</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>診断テスト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={testFirebaseConfig}>
              ⚙️ Firebase設定確認
            </Button>
            <Button onClick={testFirebaseImport}>
              📦 インポートテスト
            </Button>
            <Button onClick={testManualLogin}>
              🔐 ログインテスト
            </Button>
            <Button onClick={testUserRegistration}>
              👤 新規登録テスト
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            診断ログ
            <Button variant="outline" size="sm" onClick={clearLogs}>
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
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">📋 診断手順</h3>
        <ol className="list-decimal list-inside text-blue-800 space-y-1">
          <li><strong>Firebase設定確認</strong> - 環境変数が正しく読み込まれているか</li>
          <li><strong>インポートテスト</strong> - Firebaseライブラリが正常にインポートできるか</li>
          <li><strong>ログインテスト</strong> - 実際のFirebase認証が動作するか</li>
          <li><strong>新規登録テスト</strong> - Firebase認証の設定が正しいか</li>
        </ol>
      </div>
    </div>
  )
}