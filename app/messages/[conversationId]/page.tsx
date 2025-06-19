"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebaseConfig"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore"
import { useAuth } from "@/lib/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, User, BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import { getUserProfile, getTextbookById } from "@/lib/firestore"
import { Header } from "../../components/header"

export default function ConversationPage() {
  const { conversationId } = useParams()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [conversation, setConversation] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<{name: string, avatarUrl?: string}>({name: ""})
  const [currentUserProfile, setCurrentUserProfile] = useState<{name: string, avatarUrl?: string}>({name: ""})
  const [textbook, setTextbook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const loadConversationData = async () => {
      if (!user) {
        router.push("/login")
        return
      }
      
      try {
        // 会話データを取得
        const convDoc = await getDoc(doc(db, "conversations", conversationId as string))
        if (!convDoc.exists()) {
          router.push("/messages")
          return
        }
        
        const convData = convDoc.data()
        setConversation(convData)
        
        // 相手のユーザー情報と現在のユーザー情報を取得
        const otherUserId = convData.buyerId === user.uid ? convData.sellerId : convData.buyerId
        const [otherUserProfile, currentProfile, textbookData] = await Promise.all([
          getUserProfile(otherUserId),
          getUserProfile(user.uid),
          getTextbookById(convData.bookId)
        ])
        
        setOtherUser(otherUserProfile || {name: "不明なユーザー"})
        setCurrentUserProfile(currentProfile || {name: "あなた"})
        setTextbook(textbookData)
        
        // メッセージのリアルタイム監視
        const messagesRef = collection(db, "conversations", conversationId as string, "messages")
        const q = query(messagesRef, orderBy("createdAt"))

        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setMessages(msgs)
          setLoading(false)
        }, (error) => {
          console.error("メッセージ取得エラー:", error)
          setLoading(false)
        })
      } catch (error) {
        console.error("会話データ取得エラー:", error)
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      loadConversationData()
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [conversationId, user, authLoading, router])

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return

    try {
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("メッセージ送信エラー:", error)
      alert("メッセージの送信に失敗しました")
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/messages">
                <ArrowLeft className="h-4 w-4 mr-1" />
                戻る
              </Link>
            </Button>
            
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="font-semibold text-lg">{otherUser?.name || "不明なユーザー"}</h1>
                {textbook && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <span className="truncate">{textbook.title}</span>
                  </div>
                )}
              </div>
              
              {conversation && (
                <Badge variant={conversation.buyerId === user?.uid ? 'default' : 'secondary'}>
                  {conversation.buyerId === user?.uid ? '購入希望' : '出品者'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 教科書情報カード */}
      {textbook && (
        <div className="container mx-auto px-4 py-3">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-20 bg-muted rounded overflow-hidden">
                  <img 
                    src={textbook.imageUrl || "/placeholder.svg"} 
                    alt={textbook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{textbook.title}</h3>
                  <p className="text-sm text-muted-foreground">{textbook.author}</p>
                  <p className="text-lg font-bold text-primary">¥{textbook.price?.toLocaleString()}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/marketplace/${textbook.id}`}>詳細を見る</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* メッセージエリア */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">まだメッセージがありません</p>
              <p className="text-sm text-muted-foreground">最初のメッセージを送ってみましょう</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.senderId === user?.uid
              const userProfile = isCurrentUser ? currentUserProfile : otherUser
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={userProfile?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-muted text-xs">
                        {userProfile?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    <div className={`text-xs text-muted-foreground mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                      {userProfile?.name || (isCurrentUser ? "あなた" : "不明")}
                    </div>
                    <div
                      className={`p-3 rounded-2xl ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        isCurrentUser ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground justify-start'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {msg.createdAt?.toDate?.()?.toLocaleTimeString() || "送信中..."}
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={userProfile?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {userProfile?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* メッセージ入力エリア */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
