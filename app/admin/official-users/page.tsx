"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { setUserAsOfficial, removeOfficialStatus } from "@/lib/firestore"
import { Header } from "../../components/header"
import { Footer } from "../../components/footer"

export default function OfficialUsersPage() {
  const [userId, setUserId] = useState("")
  const [officialType, setOfficialType] = useState<'admin' | 'support' | 'team'>('admin')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleSetOfficial = async () => {
    if (!userId.trim()) {
      setResult("ユーザーIDを入力してください")
      return
    }

    setLoading(true)
    try {
      await setUserAsOfficial(userId.trim(), officialType)
      setResult(`✅ ユーザー ${userId} を公式アカウント (${officialType}) に設定しました`)
      setUserId("")
    } catch (error) {
      setResult(`❌ 設定に失敗しました: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveOfficial = async () => {
    if (!userId.trim()) {
      setResult("ユーザーIDを入力してください")
      return
    }

    setLoading(true)
    try {
      await removeOfficialStatus(userId.trim())
      setResult(`✅ ユーザー ${userId} の公式ステータスを削除しました`)
      setUserId("")
    } catch (error) {
      setResult(`❌ 削除に失敗しました: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 既知のadmin用ユーザーID（必要に応じて更新）
  const quickSetButtons = [
    { 
      name: "管理者アカウント 1", 
      userId: "QJ8p6lguz0drq4kQd8xGNzgvxVh1", // 実際のadmin UIDに変更
      type: 'admin' as const 
    },
    // 他のadminユーザーがあれば追加
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">公式アカウント管理</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>公式ステータス設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ユーザーID</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Firebase Authentication UID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">公式アカウントタイプ</label>
                <Select value={officialType} onValueChange={(value) => setOfficialType(value as 'admin' | 'support' | 'team')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (管理者)</SelectItem>
                    <SelectItem value="support">Support (サポート)</SelectItem>
                    <SelectItem value="team">Team (チーム)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSetOfficial} 
                  disabled={loading}
                  className="flex-1"
                >
                  👑 公式設定
                </Button>
                <Button 
                  onClick={handleRemoveOfficial} 
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  ❌ 公式削除
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* クイック設定ボタン */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>クイック設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickSetButtons.map((admin, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.userId}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setUserId(admin.userId)
                      setOfficialType(admin.type)
                    }}
                  >
                    選択
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 結果表示 */}
          {result && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm">{result}</p>
              </CardContent>
            </Card>
          )}

          {/* 使用方法説明 */}
          <Card>
            <CardHeader>
              <CardTitle>使用方法</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. ユーザーIDには Firebase Authentication の UID を入力してください</p>
              <p>2. 公式アカウントタイプを選択してください：</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Admin:</strong> 管理者アカウント（青い王冠アイコン）</li>
                <li><strong>Support:</strong> サポートアカウント（グレーの盾アイコン）</li>
                <li><strong>Team:</strong> チームアカウント（黄色の星アイコン）</li>
              </ul>
              <p>3. 設定後、該当ユーザーの名前の横に公式マークが表示されます</p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}