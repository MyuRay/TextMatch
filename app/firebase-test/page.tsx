"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FirebaseTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  useEffect(() => {
    addLog("🚀 Firebase接続診断ページ読み込み完了")
  }, [])

  // 1. 環境変数確認
  const testEnvironmentVariables = () => {
    addLog("📋 1. 環境変数確認...")
    
    const envVars = {
      'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    
    let allOk = true
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        addLog(`✅ ${key}: ${value.substring(0, 20)}...`)
      } else {
        addLog(`❌ ${key}: 未設定`)
        allOk = false
      }
    })
    
    addLog(allOk ? "✅ 全ての環境変数が設定されています" : "❌ 環境変数に問題があります")
    return allOk
  }

  // 2. Firebase初期化テスト
  const testFirebaseInitialization = async () => {
    addLog("🔥 2. Firebase初期化テスト...")
    setLoading(true)
    
    try {
      // Firebaseライブラリのインポート
      addLog("Firebase SDKインポート中...")
      const { initializeApp } = await import("firebase/app")
      const { getFirestore, connectFirestoreEmulator } = await import("firebase/firestore")
      const { getAuth, connectAuthEmulator } = await import("firebase/auth")
      
      addLog("✅ Firebase SDK インポート成功")
      
      // 設定オブジェクト作成
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
      
      addLog("Firebase設定オブジェクト作成完了")
      
      // アプリ初期化
      const app = initializeApp(firebaseConfig, "test-app")
      addLog("✅ Firebase App 初期化成功")
      
      // Firestore初期化
      const db = getFirestore(app)
      addLog("✅ Firestore 初期化成功")
      
      // Auth初期化
      const auth = getAuth(app)
      addLog("✅ Auth 初期化成功")
      
      addLog(`🎯 Firebase接続成功 - プロジェクト: ${firebaseConfig.projectId}`)
      
    } catch (error: any) {
      addLog(`❌ Firebase初期化エラー: ${error.message}`)
      addLog(`エラー詳細: ${error.code || 'コード不明'}`)
    } finally {
      setLoading(false)
    }
  }

  // 3. Firestore接続テスト
  const testFirestoreConnection = async () => {
    addLog("🗃️ 3. Firestore接続テスト...")
    setLoading(true)
    
    try {
      const { collection, getDocs, query, limit } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebaseConfig")
      
      addLog("Firestore設定インポート完了")
      
      // books コレクションから1件取得を試行
      addLog("books コレクションにクエリ送信中...")
      const booksRef = collection(db, 'books')
      const q = query(booksRef, limit(1))
      
      const snapshot = await getDocs(q)
      addLog(`✅ Firestore接続成功 - 取得件数: ${snapshot.size}`)
      
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0]
        addLog(`📄 サンプルデータ: ${firstDoc.id}`)
        const data = firstDoc.data()
        addLog(`📝 データ例: title="${data.title || '不明'}"`)
      } else {
        addLog("⚠️ books コレクションにデータがありません")
      }
      
    } catch (error: any) {
      addLog(`❌ Firestore接続エラー: ${error.message}`)
      addLog(`エラーコード: ${error.code || '不明'}`)
    } finally {
      setLoading(false)
    }
  }

  // 4. Auth接続テスト
  const testAuthConnection = async () => {
    addLog("🔐 4. Auth接続テスト...")
    setLoading(true)
    
    try {
      const { onAuthStateChanged } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebaseConfig")
      
      addLog("Auth設定インポート完了")
      
      // 認証状態監視
      addLog("認証状態を確認中...")
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          addLog(`✅ ユーザーログイン中: ${user.email}`)
          addLog(`UID: ${user.uid}`)
        } else {
          addLog("ℹ️ ユーザー未ログイン")
        }
        unsubscribe() // 一回だけチェック
      })
      
      addLog("✅ Auth接続成功")
      
    } catch (error: any) {
      addLog(`❌ Auth接続エラー: ${error.message}`)
      addLog(`エラーコード: ${error.code || '不明'}`)
    } finally {
      setLoading(false)
    }
  }

  // 5. 全テスト実行
  const runAllTests = async () => {
    setLogs([])
    addLog("🔍 Firebase総合診断開始...")
    
    testEnvironmentVariables()
    await testFirebaseInitialization()
    await testFirestoreConnection()
    await testAuthConnection()
    
    addLog("🏁 診断完了")
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔥 Firebase接続診断</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>診断テスト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={runAllTests} disabled={loading} className="col-span-2">
              🚀 全体診断実行
            </Button>
            <Button onClick={testEnvironmentVariables} disabled={loading}>
              📋 環境変数確認
            </Button>
            <Button onClick={testFirebaseInitialization} disabled={loading}>
              🔥 Firebase初期化
            </Button>
            <Button onClick={testFirestoreConnection} disabled={loading}>
              🗃️ Firestore接続
            </Button>
            <Button onClick={testAuthConnection} disabled={loading}>
              🔐 Auth接続
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <p className="text-gray-500">「全体診断実行」ボタンを押してください</p>
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

      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-bold text-red-900 mb-2">🚨 Firebase接続が壊れている場合の対処法</h3>
        <ul className="list-disc list-inside text-red-800 space-y-1">
          <li><strong>環境変数エラー</strong> → 開発サーバーを再起動 (Ctrl+C → npm run dev)</li>
          <li><strong>初期化エラー</strong> → Firebase設定値を再確認</li>
          <li><strong>Firestoreエラー</strong> → Firebase Consoleでデータベース設定確認</li>
          <li><strong>Authエラー</strong> → Firebase Consoleで認証設定確認</li>
        </ul>
      </div>
    </div>
  )
}