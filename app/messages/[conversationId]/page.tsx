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
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore"
import { useAuth } from "@/lib/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, User, BookOpen, Clock, CheckCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
import { getUserProfile, getTextbookById, updateTextbookStatus } from "@/lib/firestore"
import { sendEmailNotification, createMessageNotificationEmail } from "@/lib/emailService"
import { createMessageNotification, createTransactionNotification, createReceiptNotification } from "@/lib/notifications"
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
        
        // 未読メッセージを既読にする
        await markMessagesAsRead()
        
        // メッセージのリアルタイム監視
        const messagesRef = collection(db, "conversations", conversationId as string, "messages")
        const q = query(messagesRef, orderBy("createdAt"))

        unsubscribe = onSnapshot(q, async (snapshot) => {
          const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setMessages(msgs)
          setLoading(false)
          
          // 新しい未読メッセージがあれば既読にする
          await markMessagesAsRead()
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

  const markMessagesAsRead = async () => {
    if (!user || !conversationId) return
    
    try {
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      const snapshot = await getDocs(messagesRef)
      
      // 自分以外から送信されたメッセージで、isReadがfalseまたは未設定のものを既読にする
      const updatePromises = snapshot.docs
        .filter(messageDoc => {
          const data = messageDoc.data()
          return data.senderId !== user.uid && (data.isRead === false || data.isRead === undefined)
        })
        .map(messageDoc => 
          updateDoc(doc(db, "conversations", conversationId as string, "messages", messageDoc.id), {
            isRead: true
          })
        )
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error("メッセージ既読更新エラー:", error)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return

    try {
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        isRead: false,
      })
      
      // メール通知を送信
      await sendMessageNotification()
      
      // プッシュ通知を送信
      await sendPushNotification()
      
      // アプリ内通知を作成
      await createAppNotification()
      
      setNewMessage("")
    } catch (error) {
      console.error("メッセージ送信エラー:", error)
      alert("メッセージの送信に失敗しました")
    }
  }

  const sendMessageNotification = async () => {
    try {
      if (!conversation || !textbook || !user) return

      // 受信者を特定（送信者でない方）
      const recipientId = conversation.buyerId === user.uid ? conversation.sellerId : conversation.buyerId
      
      // 受信者の情報を取得
      const recipientDoc = await getDoc(doc(db, "users", recipientId))
      if (!recipientDoc.exists()) return

      const recipientData = recipientDoc.data()
      const recipientEmail = recipientData.email
      const recipientName = recipientData.fullName || "ユーザー"

      // 送信者の名前
      const senderName = currentUserProfile.name || "ユーザー"

      // メッセージプレビュー（最初の50文字）
      const messagePreview = newMessage.length > 50 
        ? newMessage.substring(0, 50) + "..." 
        : newMessage

      // メール内容を作成
      const emailNotification = createMessageNotificationEmail(
        recipientName,
        senderName,
        textbook.title,
        messagePreview
      )

      // 受信者のメールアドレスを設定
      emailNotification.to = recipientEmail

      // メール送信
      await sendEmailNotification(emailNotification)
      
      console.log(`📧 メール通知送信完了: ${recipientEmail}`)
    } catch (error) {
      console.error("メール通知送信エラー:", error)
      // メール送信エラーでもメッセージ送信は継続
    }
  }

  const sendPushNotification = async () => {
    try {
      if (!conversation || !textbook || !user) return

      // 受信者を特定（送信者でない方）
      const recipientId = conversation.buyerId === user.uid ? conversation.sellerId : conversation.buyerId
      
      // 送信者の名前
      const senderName = currentUserProfile.name || "ユーザー"
      
      // メッセージプレビュー（最初の30文字）
      const messagePreview = newMessage.length > 30 
        ? newMessage.substring(0, 30) + "..." 
        : newMessage

      // プッシュ通知を送信
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          title: `${senderName}からメッセージ`,
          body: `${textbook.title}: ${messagePreview}`,
          data: {
            conversationId: conversationId as string,
            bookId: textbook.id
          }
        })
      })

      if (response.ok) {
        console.log('📱 プッシュ通知送信完了')
      } else {
        console.log('プッシュ通知送信に失敗しました')
      }
    } catch (error) {
      console.error("プッシュ通知送信エラー:", error)
      // プッシュ通知エラーでもメッセージ送信は継続
    }
  }

  const createAppNotification = async () => {
    try {
      if (!conversation || !textbook || !user) return

      // 受信者を特定（送信者でない方）
      const recipientId = conversation.buyerId === user.uid ? conversation.sellerId : conversation.buyerId
      
      // 送信者の名前
      const senderName = currentUserProfile.name || "ユーザー"

      // アプリ内通知を作成
      await createMessageNotification(
        recipientId,
        senderName,
        textbook.title,
        conversationId as string
      )

      console.log('📲 アプリ内通知作成完了')
    } catch (error) {
      console.error("アプリ内通知作成エラー:", error)
      // 通知作成エラーでもメッセージ送信は継続
    }
  }

  const handleStatusChange = async (newStatus: 'available' | 'sold') => {
    if (!user || !textbook || !conversation) return
    
    // 出品者のみ実行可能
    if (user.uid !== conversation.sellerId) {
      alert("出品者のみが取引状況を変更できます")
      return
    }
    
    try {
      const buyerId = newStatus === 'sold' ? conversation.buyerId : undefined
      await updateTextbookStatus(textbook.id, newStatus, buyerId)
      
      // 教科書の状態を更新
      setTextbook((prev: any) => prev ? { ...prev, status: newStatus, buyerId } : null)
      
      alert(newStatus === 'sold' ? '成約済みに変更しました！' : '出品中に戻しました')
    } catch (error) {
      console.error("ステータス変更エラー:", error)
      alert("ステータスの変更に失敗しました")
    }
  }

  const handleSellToThisPerson = async () => {
    if (!user || !textbook || !conversation || !otherUser) return
    
    // 出品者のみ実行可能
    if (user.uid !== conversation.sellerId) {
      alert("出品者のみが取引状況を変更できます")
      return
    }

    const isConfirmed = window.confirm(
      `${otherUser.name}さんに売りますか？\n\n確定すると：\n・教科書が「売切」になります\n・他の購入希望者とのやり取りは終了します\n・この操作は取り消せます`
    )
    
    if (!isConfirmed) return

    try {
      // 教科書のステータスをsoldに更新し、取引状態をin_progressに設定
      const textbookRef = doc(db, "books", textbook.id)
      await updateDoc(textbookRef, {
        status: 'sold',
        buyerId: conversation.buyerId,
        transactionStatus: 'in_progress', // 取引中
        soldAt: serverTimestamp(),
      })
      
      // 教科書の状態を更新
      setTextbook((prev: any) => prev ? { 
        ...prev, 
        status: 'sold', 
        buyerId: conversation.buyerId,
        transactionStatus: 'in_progress'
      } : null)
      
      // 成約完了メッセージを自動送信
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: `🎉 成約完了！${otherUser.name}さんとの取引が成立しました。引き続きメッセージで詳細をやり取りしてください。`,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        isRead: false,
        isSystemMessage: true, // システムメッセージフラグ
      })

      // 購入者に取引成立通知を送信
      await createTransactionNotification(
        conversation.buyerId,
        textbook.title,
        true, // 購入者向け
        conversationId as string
      )
      
      alert(`${otherUser.name}さんとの取引が成立しました！`)
    } catch (error) {
      console.error("取引成立エラー:", error)
      alert("取引の成立処理に失敗しました")
    }
  }

  const handleReceiveComplete = async () => {
    if (!user || !textbook || !conversation || !otherUser) return
    
    // 購入者のみ実行可能
    if (user.uid !== conversation.buyerId) {
      alert("購入者のみが受取完了できます")
      return
    }

    const isConfirmed = window.confirm(
      "商品を受け取りましたか？\n\n受取完了すると：\n・取引が完了します\n・この操作は取り消せません"
    )
    
    if (!isConfirmed) return

    try {
      // 教科書の取引状態をcompletedに更新
      const textbookRef = doc(db, "books", textbook.id)
      await updateDoc(textbookRef, {
        transactionStatus: 'completed',
        completedAt: serverTimestamp(),
      })
      
      // 教科書の状態を更新
      setTextbook((prev: any) => prev ? { 
        ...prev, 
        transactionStatus: 'completed'
      } : null)
      
      // 受取完了メッセージを自動送信
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: `✅ ${user.displayName || '購入者'}さんが商品を受け取りました。取引完了です！お疲れ様でした。`,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        isRead: false,
        isSystemMessage: true, // システムメッセージフラグ
      })

      // 出品者に受取完了通知を送信
      await createReceiptNotification(
        textbook.userId, // 出品者ID
        textbook.title,
        otherUser.name || "購入者",
        conversationId as string
      )
      
      alert("受取完了しました！取引が完了しました。")
    } catch (error) {
      console.error("受取完了エラー:", error)
      alert("受取完了の処理に失敗しました")
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
        <div className="container mx-auto px-4 py-2">
          <Card className="bg-white">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                  <img 
                    src={(textbook.imageUrls && textbook.imageUrls[0]) || textbook.imageUrl || "/placeholder.svg"} 
                    alt={textbook.title}
                    className="w-full h-full object-contain"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{textbook.title}</h3>
                  <p className="text-xs text-muted-foreground">{textbook.author}</p>
                  <p className="text-xs text-muted-foreground">{textbook.university}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-bold text-primary">¥{textbook.price?.toLocaleString()}</p>
                    <Badge variant={textbook.status === 'sold' ? 'destructive' : 'secondary'} className="text-xs">
                      {textbook.status === 'sold' ? '売切' : '販売中'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7" asChild>
                  <Link href={`/marketplace/${textbook.id}`}>詳細</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 出品者向け成約案内・ボタン */}
          {conversation && user && user.uid === conversation.sellerId && (
            <Card className="bg-blue-50 border-blue-200 mt-2">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 text-sm">📋 出品者メニュー</h4>
                  {textbook?.status === 'sold' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-green-800 font-medium">✅ {otherUser?.name}さんとの取引成立済み</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50 text-xs px-2 py-1 h-7"
                        onClick={() => handleStatusChange('available')}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        出品中に戻す
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-blue-800">この人との取引を決定する場合</p>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
                          onClick={handleSellToThisPerson}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {otherUser?.name}さんに売る
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-2 py-1 h-7"
                          onClick={() => handleStatusChange('sold')}
                        >
                          他の人に売った
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 購入者向け成約完了表示 */}
          {conversation && user && user.uid === conversation.buyerId && textbook?.status === 'sold' && textbook?.buyerId === user.uid && (
            <Card className="bg-green-50 border-green-200 mt-2">
              <CardContent className="p-3">
                {textbook?.transactionStatus === 'completed' ? (
                  <div className="text-center">
                    <h4 className="font-medium text-green-900 text-sm mb-1">✅ 取引完了</h4>
                    <p className="text-xs text-green-800">
                      取引が完了しました。ありがとうございました！
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-900 text-sm">🎉 取引成立！</h4>
                    <p className="text-xs text-green-800 mb-2">
                      あなたとの取引が成立しました。商品を受け取ったら下のボタンを押してください。
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7 w-full"
                      onClick={handleReceiveComplete}
                    >
                      📦 受け取った
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* メッセージエリア */}
      <main className="flex-1 container mx-auto px-4 py-2 overflow-y-auto min-h-0">
        <div className="space-y-3 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">まだメッセージがありません</p>
              <p className="text-sm text-muted-foreground">最初のメッセージを送ってみましょう</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.senderId === user?.uid
              const userProfile = isCurrentUser ? currentUserProfile : otherUser
              const isSystemMessage = msg.isSystemMessage
              
              // システムメッセージの場合
              if (isSystemMessage) {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm text-green-800 text-center font-medium">{msg.text}</p>
                      <div className="flex items-center justify-center gap-1 mt-1 text-xs text-green-600">
                        <Clock className="h-3 w-3" />
                        {msg.createdAt?.toDate?.() ? (
                          msg.createdAt.toDate().toLocaleString('ja-JP', { 
                            month: 'numeric', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        ) : "送信中..."}
                      </div>
                    </div>
                  </div>
                )
              }
              
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
                        {msg.createdAt?.toDate?.() ? (
                          msg.createdAt.toDate().toLocaleString('ja-JP', { 
                            month: 'numeric', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        ) : "送信中..."}
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
      <footer className="bg-white border-t flex-shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 h-9"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()} size="sm" className="h-9">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
