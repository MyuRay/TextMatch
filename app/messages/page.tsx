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
import { NotificationSetupPrompt } from "@/components/notification-setup-prompt"

export const dynamic = 'force-dynamic'

// 最新メッセージを取得するヘルパー関数
const getLatestMessage = async (conversationId: string) => {
  try {
    const messagesRef = collection(db, "conversations", conversationId, "messages")
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(1))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const messageData = snapshot.docs[0].data()
      return {
        id: snapshot.docs[0].id,
        ...messageData,
        createdAt: messageData.createdAt?.toDate() || new Date()
      }
    }
    return null
  } catch (error) {
    console.error("最新メッセージ取得エラー:", error)
    return null
  }
}

interface Message {
  id: string
  text: string
  senderId: string
  createdAt: Date
  isRead: boolean
}

interface Conversation {
  id: string
  buyerId: string
  sellerId: string
  textbookId: string
  textbook?: {
    id: string
    title: string
    price: number
    imageUrl?: string
    author?: string
    university?: string
    status?: string
    transactionStatus?: string
  }
  otherUser?: {
    id: string
    name: string
    avatarUrl?: string
  }
  latestMessage?: Message
  unreadCount: number
  userRole: 'buyer' | 'seller'
}

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchConversations()
    }
  }, [user, loading, router])

  const fetchConversations = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // 購入者として参加している会話を取得
      const buyerQuery = query(
        collection(db, "conversations"),
        where("buyerId", "==", user.uid)
      )
      const buyerSnapshot = await getDocs(buyerQuery)

      // 販売者として参加している会話を取得  
      const sellerQuery = query(
        collection(db, "conversations"),
        where("sellerId", "==", user.uid)
      )
      const sellerSnapshot = await getDocs(sellerQuery)

      const allConversations: any[] = []
      
      // 購入者として参加している会話を処理
      buyerSnapshot.forEach(doc => {
        allConversations.push({
          id: doc.id,
          ...doc.data(),
          userRole: 'buyer'
        })
      })

      // 販売者として参加している会話を処理
      sellerSnapshot.forEach(doc => {
        allConversations.push({
          id: doc.id,
          ...doc.data(),
          userRole: 'seller'
        })
      })

      // 各会話の詳細情報を取得
      const conversationsWithDetails = await Promise.all(
        allConversations.map(async (conv) => {
          try {
            // 相手のユーザー情報を取得
            const otherUserId = conv.userRole === 'buyer' ? conv.sellerId : conv.buyerId
            const otherUser = await getUserProfile(otherUserId)

            // 教科書情報を取得
            const textbook = (conv as any).bookId ? await getTextbookById((conv as any).bookId) : null

            // 最新メッセージを取得
            const latestMessage = await getLatestMessage(conv.id)

            // メッセージが存在しない会話はスキップ
            if (!latestMessage) return null

            // 未読メッセージ数を計算（簡易版：自分以外から送信された最新メッセージが未読かどうか）
            const unreadCount = latestMessage && 
                               (latestMessage as any).senderId !== user.uid && 
                               !(latestMessage as any).isRead ? 1 : 0

            return {
              ...conv,
              otherUser,
              textbook,
              latestMessage,
              unreadCount
            }
          } catch (error) {
            console.error("会話詳細取得エラー:", error)
            return null
          }
        })
      )

      // nullの要素を除去してタイムスタンプでソート
      const validConversations = conversationsWithDetails
        .filter((conv): conv is Conversation => conv !== null)
        .sort((a, b) => {
          const aTime = a.latestMessage?.createdAt || new Date(0)
          const bTime = b.latestMessage?.createdAt || new Date(0)
          return bTime.getTime() - aTime.getTime()
        })

      setConversations(validConversations)
    } catch (error) {
      console.error("会話一覧取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}分前`
    } else if (hours < 24) {
      return `${hours}時間前`
    } else if (days < 7) {
      return `${days}日前`
    } else {
      return date.toLocaleDateString('ja-JP')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto py-10 px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">メッセージ</h1>
          </div>

          {/* 通知設定プロンプト */}
          <NotificationSetupPrompt />

          {conversations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">メッセージがありません</h3>
                <p className="text-muted-foreground mb-4">
                  まだメッセージのやり取りがありません。<br />
                  教科書を購入または出品してメッセージを始めましょう。
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/marketplace">教科書を探す</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/post-textbook">教科書を出品</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    conversation.unreadCount > 0 ? 'border-primary/20 bg-primary/5' : ''
                  }`}
                  onClick={() => router.push(`/messages/${conversation.id}`)}
                >
                  <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* アバター */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.otherUser?.avatarUrl} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">
                                {conversation.otherUser?.name || '匿名ユーザー'}
                              </h3>
                              <Badge variant={conversation.userRole === 'buyer' ? 'secondary' : 'default'}>
                                {conversation.userRole === 'buyer' ? '販売者' : '購入希望者'}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="rounded-full px-2 py-1">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {conversation.latestMessage && 
                                formatTimestamp(conversation.latestMessage.createdAt)
                              }
                            </div>
                          </div>

                          {/* 教科書情報 */}
                          {conversation.textbook && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                    {conversation.textbook.title}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {conversation.textbook.author && (
                                      <p className="text-xs text-gray-600">
                                        📝 {conversation.textbook.author}
                                      </p>
                                    )}
                                    <Badge variant={(conversation.textbook.status === 'sold' || conversation.textbook.transactionStatus === 'paid') ? 'destructive' : 'secondary'} className="text-xs">
                                      {(conversation.textbook.status === 'sold' || conversation.textbook.transactionStatus === 'paid') ? '売切' : '販売中'}
                                    </Badge>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs bg-white hover:bg-blue-50 ml-2" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/marketplace/${conversation.textbook?.id}`)
                                  }}
                                >
                                  📖 詳細
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* 最新メッセージ */}
                          {conversation.latestMessage && (
                            <div className="text-sm text-muted-foreground overflow-hidden">
                              <div className="truncate">
                                <span className="font-medium">
                                  {conversation.latestMessage.senderId === user?.uid ? 'あなた' : conversation.otherUser?.name}:
                                </span>
                                <span className="ml-1">
                                  {conversation.latestMessage.text}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}