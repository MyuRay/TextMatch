"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
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
              const [otherUserProfile, textbook] = await Promise.all([
                getUserProfile(otherUserId),
                getTextbookById(conv.bookId)
              ])
              
              return {
                ...conv,
                otherUserName: otherUserProfile?.name || "不明なユーザー",
                otherUserAvatar: otherUserProfile?.avatarUrl,
                textbook,
                otherUserId,
                role: conv.buyerId === user.uid ? 'buyer' : 'seller'
              }
            } catch (error) {
              console.error("会話詳細取得エラー:", error)
              return {
                ...conv,
                otherUserName: "不明",
                textbook: null,
                otherUserId: conv.buyerId === user.uid ? conv.sellerId : conv.buyerId,
                role: conv.buyerId === user.uid ? 'buyer' : 'seller'
              }
            }
          })
        )
        
        setConversations(enrichedConversations)
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
              <Card key={conv.id} className="hover:shadow-md transition-shadow cursor-pointer">
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
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {conv.createdAt?.toDate?.()?.toLocaleDateString() || "不明"}
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
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage || "まだメッセージがありません"}
                          </p>
                          <Button size="sm" variant="ghost" className="ml-2">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            チャット
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
