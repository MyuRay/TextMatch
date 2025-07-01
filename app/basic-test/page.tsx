"use client"

import { useState } from "react"

export default function BasicTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [count, setCount] = useState(0)

  const addLog = (message: string) => {
    console.log("ログ追加:", message)
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]
      console.log("新しいログ配列:", newLogs)
      return newLogs
    })
  }

  const testBasicReact = () => {
    console.log("testBasicReact 関数が呼ばれました")
    addLog("✅ React基本動作テスト")
    setCount(prev => prev + 1)
  }

  const testEnvironment = () => {
    console.log("testEnvironment 関数が呼ばれました")
    addLog("🔍 環境確認開始...")
    
    // ブラウザ環境確認
    addLog(`Browser: ${typeof window !== 'undefined' ? 'ブラウザ' : 'サーバー'}`)
    addLog(`Console: ${typeof console !== 'undefined' ? '利用可能' : '利用不可'}`)
    
    // Next.js環境確認
    addLog(`Node env: ${process.env.NODE_ENV}`)
    
    // 環境変数確認（最初の数文字だけ）
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    addLog(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : '未設定'}`)
  }

  const testConsoleLog = () => {
    console.log("=== Console Log テスト ===")
    console.log("これがコンソールに表示されれば正常です")
    console.error("これはエラーメッセージのテストです")
    console.warn("これは警告メッセージのテストです")
    
    addLog("💬 コンソールログテスト実行 - F12でコンソールを確認してください")
  }

  const testFirebaseImport = async () => {
    addLog("📦 Firebase インポートテスト開始...")
    
    try {
      console.log("Firebase/app インポート試行...")
      const firebaseApp = await import("firebase/app")
      addLog("✅ firebase/app インポート成功")
      console.log("firebase/app:", firebaseApp)
      
      console.log("Firebase/firestore インポート試行...")
      const firestore = await import("firebase/firestore")
      addLog("✅ firebase/firestore インポート成功")
      console.log("firebase/firestore:", firestore)
      
      console.log("Firebase/auth インポート試行...")
      const auth = await import("firebase/auth")
      addLog("✅ firebase/auth インポート成功")
      console.log("firebase/auth:", auth)
      
    } catch (error) {
      console.error("Firebase インポートエラー:", error)
      addLog(`❌ Firebase インポートエラー: ${error}`)
    }
  }

  const clearLogs = () => {
    console.log("ログクリア")
    setLogs([])
    setCount(0)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 基本動作テスト</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>現在の状態</h3>
        <p>クリック回数: {count}</p>
        <p>ログ数: {logs.length}</p>
        <p>現在時刻: {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>テストボタン</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button 
            onClick={testBasicReact}
            style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            📱 React動作テスト
          </button>
          
          <button 
            onClick={testEnvironment}
            style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            🔍 環境確認
          </button>
          
          <button 
            onClick={testConsoleLog}
            style={{ padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            💬 コンソールテスト
          </button>
          
          <button 
            onClick={testFirebaseImport}
            style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            📦 Firebase インポート
          </button>
          
          <button 
            onClick={clearLogs}
            style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            🗑️ ログクリア
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>ログ表示</h3>
        <div 
          style={{ 
            backgroundColor: '#000', 
            color: '#00ff00', 
            padding: '15px', 
            borderRadius: '5px', 
            height: '300px', 
            overflowY: 'scroll',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        >
          {logs.length === 0 ? (
            <p style={{ color: '#888' }}>テストボタンを押してください...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>🔧 デバッグ手順</h3>
        <ol>
          <li><strong>React動作テスト</strong> - ボタンクリックとステート更新が動作するか</li>
          <li><strong>環境確認</strong> - Next.js環境と環境変数の読み込み確認</li>
          <li><strong>コンソールテスト</strong> - ブラウザのコンソール出力確認</li>
          <li><strong>Firebase インポート</strong> - Firebaseライブラリの読み込み確認</li>
        </ol>
        <p><strong>重要:</strong> F12を押して開発者ツールのコンソールタブも確認してください</p>
      </div>
    </div>
  )
}