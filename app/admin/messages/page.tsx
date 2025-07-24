"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { 
  getAllConversations, 
  AdminConversation,
  deleteConversation 
} from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ChevronLeft, 
  MessageCircle, 
  Search, 
  Trash2, 
  Eye,
  Filter,
  AlertTriangle
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

export default function AdminMessagesPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<AdminConversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<AdminConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 管理者権限チェック
  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin(userProfile)) {
        alert('管理者権限が必要です')
        router.push('/admin')
        return
      }
    } else if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, userProfile, loading, router])

  // 会話一覧を読み込み
  useEffect(() => {
    const loadConversations = async () => {
      if (!user || !isAdmin(userProfile)) return
      
      try {
        setIsLoading(true)
        const result = await getAllConversations(50) // 最初の50件を取得
        setConversations(result.conversations)
        setFilteredConversations(result.conversations)
      } catch (error) {
        console.error("会話一覧読み込みエラー:", error)
        alert("会話一覧の読み込みに失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [user, userProfile])

  // 検索フィルター
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter(conv =>
      conv.bookTitle.toLowerCase().includes(query) ||
      conv.buyerName.toLowerCase().includes(query) ||
      conv.sellerName.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    )
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  // 会話削除処理
  const handleDeleteConversation = async (conversationId: string) => {
    if (!deleteReason.trim()) {
      alert("削除理由を入力してください")
      return
    }

    try {
      setDeletingId(conversationId)
      await deleteConversation(conversationId, deleteReason)
      
      // ローカル状態を更新
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      setFilteredConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      setDeleteReason("")
      alert("会話を削除しました")
    } catch (error) {
      console.error("会話削除エラー:", error)
      alert("会話の削除に失敗しました")
    } finally {
      setDeletingId(null)
    }
  }

  // 日付フォーマット
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '不明'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ja-JP')
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    管理画面に戻る
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" />
                    メッセージ管理
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    ユーザー間の会話を監視・管理します
                  </p>
                </div>
              </div>
            </div>

            {/* 検索・フィルター */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="教科書名、ユーザー名、メッセージ内容で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Badge variant="secondary" className="self-start">
                    {filteredConversations.length}件の会話
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 会話一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>会話一覧</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "検索条件に一致する会話が見つかりませんでした" : "まだ会話がありません"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => (
                      <div key={conversation.id} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1 truncate">
                              📚 {conversation.bookTitle}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                              <span>👤 購入者: {conversation.buyerName}</span>
                              <span>🏪 販売者: {conversation.sellerName}</span>
                              <span>💬 {conversation.messageCount}件のメッセージ</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              最新: {conversation.lastMessage || "メッセージなし"}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="text-xs text-muted-foreground text-right">
                              {formatDate(conversation.lastMessageAt)}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/messages/${conversation.id}`}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  詳細
                                </Link>
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    disabled={deletingId === conversation.id}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    削除
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      会話の削除
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      この会話とすべてのメッセージが完全に削除されます。
                                      この操作は取り消せません。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">削除理由 *</label>
                                      <Textarea
                                        placeholder="削除の理由を入力してください..."
                                        value={deleteReason}
                                        onChange={(e) => setDeleteReason(e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                    
                                    <div className="bg-muted p-3 rounded-lg">
                                      <p className="text-sm">
                                        <strong>対象会話:</strong> {conversation.bookTitle}
                                      </p>
                                      <p className="text-sm">
                                        <strong>参加者:</strong> {conversation.buyerName} ↔ {conversation.sellerName}
                                      </p>
                                      <p className="text-sm">
                                        <strong>メッセージ数:</strong> {conversation.messageCount}件
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteReason("")}>
                                      キャンセル
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteConversation(conversation.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                      disabled={!deleteReason.trim() || deletingId === conversation.id}
                                    >
                                      {deletingId === conversation.id ? "削除中..." : "削除する"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}