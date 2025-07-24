"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { 
  getConversationMessages, 
  AdminMessage,
  deleteMessage 
} from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ChevronLeft, 
  MessageCircle, 
  Trash2, 
  AlertTriangle,
  User,
  Bot,
  Flag
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

export default function AdminMessageDetailPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // メッセージ一覧を読み込み
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !isAdmin(userProfile) || !conversationId) return
      
      try {
        setIsLoading(true)
        const messageList = await getConversationMessages(conversationId)
        setMessages(messageList)
      } catch (error) {
        console.error("メッセージ読み込みエラー:", error)
        alert("メッセージの読み込みに失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [user, userProfile, conversationId])

  // メッセージ削除処理
  const handleDeleteMessage = async (messageId: string) => {
    if (!deleteReason.trim()) {
      alert("削除理由を入力してください")
      return
    }

    try {
      setDeletingId(messageId)
      await deleteMessage(conversationId, messageId, deleteReason)
      
      // ローカル状態を更新
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      
      setDeleteReason("")
      alert("メッセージを削除しました")
    } catch (error) {
      console.error("メッセージ削除エラー:", error)
      alert("メッセージの削除に失敗しました")
    } finally {
      setDeletingId(null)
    }
  }

  // 日付フォーマット
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '不明'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // メッセージタイプ判定
  const getMessageTypeIcon = (message: AdminMessage) => {
    if (message.isSystemMessage) {
      return <Bot className="h-4 w-4 text-blue-500" />
    }
    return <User className="h-4 w-4 text-gray-500" />
  }

  const getMessageTypeLabel = (message: AdminMessage) => {
    if (message.isSystemMessage) {
      return "システム"
    }
    return "ユーザー"
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col gap-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/messages">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    メッセージ管理に戻る
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" />
                    会話詳細
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    会話ID: {conversationId}
                  </p>
                </div>
              </div>
              
              <Badge variant="secondary">
                {messages.length}件のメッセージ
              </Badge>
            </div>

            {/* メッセージ一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>メッセージ履歴</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">メッセージがありません</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {messages.map((message, index) => (
                      <div key={message.id} className="p-4 hover:bg-muted/30">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            {getMessageTypeIcon(message)}
                            <span className="font-medium text-sm">
                              {message.senderName}
                            </span>
                            <Badge 
                              variant={message.isSystemMessage ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {getMessageTypeLabel(message)}
                            </Badge>
                            {message.isReported && (
                              <Badge variant="destructive" className="text-xs">
                                <Flag className="h-3 w-3 mr-1" />
                                通報済み
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)}
                            </span>
                            
                            {!message.isSystemMessage && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                                    disabled={deletingId === message.id}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      メッセージの削除
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      このメッセージが完全に削除されます。
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
                                        <strong>送信者:</strong> {message.senderName}
                                      </p>
                                      <p className="text-sm">
                                        <strong>送信日時:</strong> {formatDate(message.createdAt)}
                                      </p>
                                      <p className="text-sm">
                                        <strong>内容:</strong> {message.text.substring(0, 100)}
                                        {message.text.length > 100 && "..."}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteReason("")}>
                                      キャンセル
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                      disabled={!deleteReason.trim() || deletingId === message.id}
                                    >
                                      {deletingId === message.id ? "削除中..." : "削除する"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {message.isRead ? "✓ 既読" : "未読"}
                          </span>
                          <span>
                            ID: {message.id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 統計情報 */}
            <Card>
              <CardHeader>
                <CardTitle>会話統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {messages.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      総メッセージ数
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {messages.filter(m => m.isSystemMessage).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      システムメッセージ
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {messages.filter(m => m.isRead).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      既読メッセージ
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {messages.filter(m => m.isReported).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      通報済みメッセージ
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}