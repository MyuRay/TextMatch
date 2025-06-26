"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, where, doc, getDoc, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/lib/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, User, BookOpen } from "lucide-react"
import Link from "next/link"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { getUserProfile, getTextbookById } from "@/lib/firestore"

// 最新メッセージを取得するヘルパー関数
const getLatestMessage = async (conversationId: string) => {
  try {
    console.log("最新メッセージ取得開始 - 会話ID:", conversationId)
    const messagesRef = collection(db, "conversations", conversationId, "messages")
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1))
    const snapshot = await getDocs(q)
    
    console.log("スナップショット結果:", {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.length
    })
    
    if (snapshot.empty) {
      console.log("メッセージが見つかりませんでした")
      return null
    }
    
    const messageData = snapshot.docs[0].data()
    console.log("最新メッセージの生データ:", messageData)
    console.log("メッセージフィールド:", {
      content: messageData.content,
      message: messageData.message,
      text: messageData.text,
      senderId: messageData.senderId,
      createdAt: messageData.createdAt
    })
    
    return {
      content: messageData.text || messageData.content || messageData.message || "",
      createdAt: messageData.createdAt,
      senderId: messageData.senderId
    }
  } catch (error) {
    console.error("最新メッセージ取得エラー:", error)
    console.error("エラーの詳細:", {
      code: (error as any)?.code,
      message: (error as any)?.message,
      conversationId
    })
    return null
  }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        // buyerIdまたはsellerIdでクエリ
        const q1 = query(
          collection(db, "conversations"),
          where("buyerId", "==", user.uid)
        )
        const q2 = query(
          collection(db, "conversations"),
          where("sellerId", "==", user.uid)
        )
        
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ])
        
        const conversations1 = snapshot1.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any))
        const conversations2 = snapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any))
        
        // 重複を削除してマージ
        const allConversations = [...conversations1, ...conversations2]
        const uniqueConversations = allConversations.filter((conv, index, self) => 
          index === self.findIndex(c => c.id === conv.id)
        )
        
        // 各会話に詳細情報を追加
        const enrichedConversations = await Promise.all(
          uniqueConversations.map(async (conv) => {
            try {
              const otherUserId = conv.buyerId === user.uid ? conv.sellerId : conv.buyerId
              const [otherUserProfile, textbook, latestMessage] = await Promise.all([
                getUserProfile(otherUserId),
                getTextbookById(conv.bookId),
                getLatestMessage(conv.id)
              ])
              
              console.log(`会話${conv.id}の最新メッセージ:`, latestMessage)
              
              return {
                ...conv,
                otherUserName: otherUserProfile?.name || "不明なユーザー",
                otherUserAvatar: otherUserProfile?.avatarUrl,
                textbook,
                otherUserId,
                role: conv.buyerId === user.uid ? 'buyer' : 'seller',
                unreadCount: conv.unreadCount?.[user.uid] || 0,
                latestMessage: latestMessage
              }
            } catch (error) {
              console.error("会話詳細取得エラー:", error)
              return {
                ...conv,
                otherUserName: "不明",
                textbook: null,
                otherUserId: conv.buyerId === user.uid ? conv.sellerId : conv.buyerId,
                role: conv.buyerId === user.uid ? 'buyer' : 'seller',
                unreadCount: conv.unreadCount?.[user.uid] || 0,
                latestMessage: null
              }
            }
          })
        )
        
        // 実際にメッセージが存在する会話のみをフィルタリング
        const conversationsWithMessages = enrichedConversations.filter(conv => 
          conv.latestMessage && conv.latestMessage.content
        )
        
        // 最新のメッセージ順に並び替え（latestMessage.createdAt、lastMessageAt、またはcreatedAtの降順）
        const sortedConversations = conversationsWithMessages.sort((a, b) => {
          const aTime = a.latestMessage?.createdAt?.seconds || a.lastMessageAt?.seconds || a.createdAt?.seconds || 0
          const bTime = b.latestMessage?.createdAt?.seconds || b.lastMessageAt?.seconds || b.createdAt?.seconds || 0
          return bTime - aTime // 降順（新しい順）
        })
        
        setConversations(sortedConversations)
      } catch (error) {
        console.error("会話取得エラー:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      fetchConversations()
    }
  }, [user, authLoading, router])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="container mx-auto py-8 px-4 flex-1 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">メッセージ</h1>
          <Badge variant="secondary" className="text-sm">
            {conversations.length}件の会話
          </Badge>
        </div>

        {(loading || authLoading) ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">メッセージはまだありません</h3>
            <p className="text-muted-foreground mb-6">教科書の詳細ページから出品者に連絡してみましょう</p>
            <Button asChild>
              <Link href="/marketplace">教科書を探す</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card key={conv.id} className={`hover:shadow-md transition-shadow cursor-pointer ${conv.unreadCount > 0 ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
                <Link href={`/messages/${conv.id}`} className="block">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.otherUserAvatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.otherUserName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{conv.otherUserName || "不明なユーザー"}</h3>
                            <Badge variant={conv.role === 'buyer' ? 'default' : 'secondary'} className="text-xs">
                              {conv.role === 'buyer' ? '購入希望' : '出品者'}
                            </Badge>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {(conv.latestMessage?.createdAt || conv.lastMessageAt || conv.createdAt)?.toDate?.()?.toLocaleDateString() || "不明"}
                          </div>
                        </div>
                        
                        {conv.textbook && (
                          <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{conv.textbook.title}</span>
                            <span className="text-sm text-muted-foreground">
                              ¥{conv.textbook.price?.toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {conv.latestMessage && conv.latestMessage.content ? (
                              <div className="space-y-1">
                                <p className={`text-sm ${conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                  <span className={conv.latestMessage.senderId === user?.uid ? "text-blue-600 font-medium" : "font-medium"}>
                                    {conv.latestMessage.senderId === user?.uid ? "あなた" : conv.otherUserName}:
                                  </span>
                                  <span className="ml-1">{conv.latestMessage.content}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {conv.latestMessage.createdAt?.toDate?.()?.toLocaleString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) || ""}
                                </p>
                              </div>
                            ) : conv.lastMessage ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                まだメッセージがありません
                              </p>
                            )}
                          </div>
                          <Button size="sm" variant="ghost" className="flex-shrink-0">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">チャット</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
