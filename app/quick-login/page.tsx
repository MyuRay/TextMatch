"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loginUser } from "@/lib/firebaseAuth"
import { useRouter } from "next/navigation"

export default function QuickLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    console.log("ログイン試行:", { email, password: password ? "***" : "empty" })
    
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      console.log("ログイン開始:", email)
      const user = await loginUser(email, password)
      console.log("ログイン成功:", user)
      
      alert("ログイン成功！")
      router.push("/debug-notification")
    } catch (err: any) {
      console.error("ログインエラー:", err)
      setError(`ログインエラー: ${err.code} - ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testFirebaseConnection = () => {
    console.log("Firebase設定テスト")
    console.log("環境変数:", {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + "...",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>🚀 クイックログイン</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">メールアドレス</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">パスワード</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  required
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "ログイン中..." : "ログイン"}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={testFirebaseConnection}
                  className="w-full"
                >
                  Firebase設定確認
                </Button>
                
                <div className="text-xs text-gray-500">
                  <p>入力値: email={email ? "入力済み" : "未入力"}, password={password ? "入力済み" : "未入力"}</p>
                  <p>ボタン状態: {loading ? "ローディング中" : "準備完了"}</p>
                </div>
              </div>
            </div>
          </form>
          
          <div className="text-sm text-gray-600">
            <p>テスト用のログインページです</p>
            <p>エラーが出る場合はブラウザのコンソールを確認してください</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}