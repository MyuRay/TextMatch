"use client"

import { useEffect, useState, useRef } from "react"
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
import { ArrowLeft, Send, User, BookOpen, Clock, CheckCircle, RotateCcw, CreditCard } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { getUserProfile, getTextbookById, updateTextbookStatus } from "@/lib/firestore"
import { sendEmailNotification, createMessageNotificationEmail } from "@/lib/emailService"
import { createMessageNotification, createTransactionNotification, createReceiptNotification } from "@/lib/notifications"
import { sendPushNotification } from "@/lib/fcm"
import { Header } from "../../components/header"
import { OfficialIcon } from "../../components/official-badge"
import StripePaymentForm from "@/components/stripe-payment-form"

export default function ConversationPage() {
  const { conversationId } = useParams()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [conversation, setConversation] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<{name: string, avatarUrl?: string, isOfficial?: boolean, officialType?: string}>({name: ""})
  const [currentUserProfile, setCurrentUserProfile] = useState<{name: string, avatarUrl?: string, isOfficial?: boolean, officialType?: string}>({name: ""})
  const [textbook, setTextbook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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

  // メッセージを一番下にスクロールする関数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // メッセージが更新されたときに自動スクロール
  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      try {
        await sendMessageNotification()
      } catch (error) {
        console.error("メール通知エラー:", error)
      }
      
      // プッシュ通知を送信
      try {
        await sendPushNotificationToUser()
      } catch (error) {
        console.error("プッシュ通知エラー:", error)
      }
      
      // アプリ内通知を作成
      try {
        await createAppNotification()
      } catch (error) {
        console.error("アプリ内通知エラー:", error)
      }
      
      setNewMessage("")
      
      // メッセージ送信後、少し遅れてスクロール
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error("メッセージ送信エラー:", error)
      alert("メッセージの送信に失敗しました")
    }
  }

  const sendMessageNotification = async () => {
    try {
      if (!conversation || !textbook || !user) return

      // 受信者を特定（送信者でない方）
      let recipientId = null
      if (conversation.buyerId === user.uid) {
        recipientId = conversation.sellerId
      } else if (conversation.sellerId === user.uid) {
        recipientId = conversation.buyerId
      }
      
      if (!recipientId || recipientId === user.uid) return
      
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
    } catch (error) {
      console.error("メール通知送信エラー:", error)
      // メール送信エラーでもメッセージ送信は継続
    }
  }

  const sendPushNotificationToUser = async () => {
    try {
      if (!conversation || !textbook || !user) return

      // 受信者を特定（送信者でない方）
      let recipientId = null
      if (conversation.buyerId === user.uid) {
        recipientId = conversation.sellerId
      } else if (conversation.sellerId === user.uid) {
        recipientId = conversation.buyerId
      }
      
      if (!recipientId || recipientId === user.uid) return
      
      // 送信者の名前
      const senderName = currentUserProfile.name || "ユーザー"
      
      // メッセージプレビュー（最初の30文字）
      const messagePreview = newMessage.length > 30 
        ? newMessage.substring(0, 30) + "..." 
        : newMessage

      // プッシュ通知を送信
      await sendPushNotification(
        recipientId,
        `${senderName}からメッセージ`,
        `${textbook.title}: ${messagePreview}`,
        {
          type: 'message',
          conversationId: conversationId as string,
          bookId: textbook.id,
          actionUrl: `/messages/${conversationId}`
        }
      )
    } catch (error) {
      console.error("プッシュ通知送信エラー:", error)
      // プッシュ通知エラーでもメッセージ送信は継続
    }
  }

  const createAppNotification = async () => {
    try {
      if (!conversation || !textbook || !user) return

      // 受信者を特定（送信者でない方）
      let recipientId = null
      if (conversation.buyerId === user.uid) {
        recipientId = conversation.sellerId
      } else if (conversation.sellerId === user.uid) {
        recipientId = conversation.buyerId
      }
      
      if (!recipientId || recipientId === user.uid) return
      
      // 送信者の名前
      const senderName = currentUserProfile.name || "ユーザー"

      // アプリ内通知を作成
      await createMessageNotification(
        recipientId,
        senderName,
        textbook.title,
        conversationId as string
      )
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
      // 会話レベルでの取引状態を更新（教科書自体の状態は変更しない）
      const conversationRef = doc(db, "conversations", conversationId as string)
      await updateDoc(conversationRef, {
        transactionStatus: 'selected', // この会話で取引相手が選択された
        selectedAt: serverTimestamp(),
      })
      
      // 会話の状態を更新
      setConversation((prev: any) => prev ? { 
        ...prev, 
        transactionStatus: 'selected'
      } : null)
      
      // 成約完了メッセージを自動送信
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: `🎉 取引相手決定！${otherUser.name}さんとの取引が成立しました。${otherUser.name}さんは決済ボタンで支払いを行ってください。`,
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

  const handlePayment = async () => {
    if (!user || !textbook || !conversation || !otherUser) {
      alert("必要な情報が不足しています")
      return
    }
    
    // 購入者のみ実行可能
    if (user.uid !== conversation.buyerId) {
      alert("購入者のみが決済できます")
      return
    }

    // 価格の妥当性確認
    if (!textbook.price || textbook.price <= 0) {
      alert("無効な価格です")
      return
    }

    setPaymentLoading(true)
    try {
      // 出品者のStripe Connect情報を確認
      const sellerProfile = await getUserProfile(conversation.sellerId)
      if (!sellerProfile?.stripeAccountId) {
        alert("出品者がStripe Connectの設定を完了していません。\n直接やり取りして現金取引を行ってください。")
        return
      }

      console.log('Payment Intent作成開始:', {
        amount: textbook.price,
        sellerAccountId: sellerProfile.stripeAccountId,
        textbookId: textbook.id,
        buyerId: user.uid
      })

      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: textbook.price, // JPYは円単位のため変換不要
          connectedAccountId: sellerProfile.stripeAccountId,
          textbookId: textbook.id,
          buyerId: user.uid,
        }),
      })
      
      const data = await response.json()
      console.log('Payment Intent Response:', data)
      
      if (response.ok && data.client_secret) {
        setClientSecret(data.client_secret)
        setPaymentDialogOpen(true)
      } else {
        const errorMessage = data.error || 'Payment Intent作成に失敗しました'
        console.error('Payment Intent Error:', errorMessage)
        alert('決済の準備に失敗しました: ' + errorMessage)
      }
    } catch (error) {
      console.error('Payment intent creation error:', error)
      alert('決済の準備中にネットワークエラーが発生しました。インターネット接続を確認してください。')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    setPaymentDialogOpen(false)
    
    try {
      // 会話の取引状態をpaidに更新
      const conversationRef = doc(db, "conversations", conversationId as string)
      await updateDoc(conversationRef, {
        transactionStatus: 'paid', // 決済完了
        paidAt: serverTimestamp(),
      })
      
      // 教科書の取引状態もpaidに更新
      const textbookRef = doc(db, "books", textbook.id)
      await updateDoc(textbookRef, {
        transactionStatus: 'paid', // 決済完了
        paidAt: serverTimestamp(),
      })
      
      // 会話の状態を更新
      setConversation((prev: any) => prev ? { 
        ...prev, 
        transactionStatus: 'paid'
      } : null)
      
      // 教科書の状態を更新
      setTextbook((prev: any) => prev ? { 
        ...prev, 
        transactionStatus: 'paid'
      } : null)
      
      // 決済完了メッセージを自動送信
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: `💳 ${user?.displayName || '購入者'}さんが決済を完了しました。商品の受け渡しを行ってください。`,
        senderId: user!.uid,
        createdAt: serverTimestamp(),
        isRead: false,
        isSystemMessage: true,
      })
      
      alert("決済が完了しました！出品者と受け渡しの詳細を相談してください。")
    } catch (error) {
      console.error("決済後処理エラー:", error)
      alert("決済は完了しましたが、ステータス更新でエラーが発生しました")
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
      // 教科書の状態をsoldに更新し、取引完了状態に設定
      const textbookRef = doc(db, "books", textbook.id)
      await updateDoc(textbookRef, {
        status: 'sold',
        buyerId: conversation.buyerId,
        transactionStatus: 'completed',
        completedAt: serverTimestamp(),
      })
      
      // 会話の取引状態も更新
      const conversationRef = doc(db, "conversations", conversationId as string)
      await updateDoc(conversationRef, {
        transactionStatus: 'completed',
        completedAt: serverTimestamp(),
      })
      
      // 教科書の状態を更新
      setTextbook((prev: any) => prev ? { 
        ...prev, 
        status: 'sold',
        buyerId: conversation.buyerId,
        transactionStatus: 'completed'
      } : null)
      
      // 会話の状態を更新
      setConversation((prev: any) => prev ? { 
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
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={otherUser?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="font-semibold text-lg truncate">{otherUser?.name || "不明なユーザー"}</h1>
                  <OfficialIcon 
                    isOfficial={otherUser?.isOfficial} 
                    officialType={otherUser?.officialType as 'admin' | 'support' | 'team'} 
                  />
                </div>
                {textbook && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <BookOpen className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{textbook.title}</span>
                  </div>
                )}
              </div>
              
              {conversation && (
                <Badge variant={conversation.buyerId === user?.uid ? 'default' : 'secondary'} className="flex-shrink-0">
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
                  <h3 className="font-semibold text-sm line-clamp-2 break-words">{textbook.title}</h3>
                  {textbook.author && (
                    <p className="text-xs text-muted-foreground truncate">{textbook.author}</p>
                  )}
                  {textbook.university && (
                    <p className="text-xs text-muted-foreground truncate">{textbook.university}</p>
                  )}
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
                  {conversation.transactionStatus === 'selected' || conversation.transactionStatus === 'paid' || conversation.transactionStatus === 'completed' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-green-800 font-medium">✅ {otherUser?.name}さんとの取引成立済み</p>
                      </div>
                      {conversation.transactionStatus === 'completed' ? (
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">✅ 取引完了</p>
                          <p className="text-xs text-gray-500">この取引は完了しました</p>
                        </div>
                      ) : conversation.transactionStatus === 'paid' ? (
                        <div className="text-center">
                          <p className="text-xs text-blue-800 mb-1">📦 受取待ち</p>
                          <p className="text-xs text-blue-600">購入者が受取完了を行うまでお待ちください</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-blue-800 mb-1">💳 決済待ち</p>
                          <p className="text-xs text-blue-600 mb-2">購入者が決済を行うまでお待ちください</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs px-2 py-1 h-7 w-full"
                            onClick={async () => {
                              if (window.confirm('取引をキャンセルして出品中に戻しますか？')) {
                                try {
                                  // 会話の取引状態をリセット
                                  const conversationRef = doc(db, "conversations", conversationId as string)
                                  await updateDoc(conversationRef, {
                                    transactionStatus: null,
                                    selectedAt: null,
                                  })
                                  
                                  // 会話の状態を更新
                                  setConversation((prev: any) => prev ? { 
                                    ...prev, 
                                    transactionStatus: null
                                  } : null)
                                  
                                  // キャンセルメッセージを自動送信
                                  const messagesRef = collection(db, "conversations", conversationId as string, "messages")
                                  await addDoc(messagesRef, {
                                    text: `📢 システム通知: 出品者が取引をキャンセルしました。商品は再び出品中の状態に戻りました。`,
                                    senderId: "system",
                                    createdAt: serverTimestamp(),
                                    isRead: false,
                                    isSystemMessage: true
                                  })
                                  
                                  alert('出品中に戻しました')
                                } catch (error) {
                                  console.error('取引キャンセルエラー:', error)
                                  alert('取引のキャンセルに失敗しました')
                                }
                              }
                            }}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            出品中に戻す
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : textbook?.status === 'sold' && textbook?.buyerId !== conversation.buyerId ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-orange-800 font-medium">⚠️ 他の人と取引成立済み</p>
                      </div>
                      <p className="text-xs text-orange-600">この商品は他の人との取引が成立しています</p>
                    </div>
                  ) : textbook?.status === 'sold' && textbook?.buyerId === conversation.buyerId ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {textbook?.transactionStatus === 'completed' ? (
                          <p className="text-xs text-green-800 font-medium">✅ {otherUser?.name}さんとの取引完了済み</p>
                        ) : (
                          <p className="text-xs text-blue-800 font-medium">📦 {otherUser?.name}さんとの取引進行中</p>
                        )}
                      </div>
                      {textbook?.transactionStatus === 'completed' ? (
                        <p className="text-xs text-green-600">この取引は正常に完了しました</p>
                      ) : (
                        <p className="text-xs text-blue-600">受取完了をお待ちください</p>
                      )}
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


          {/* 購入者向け販売許可待ち表示 */}
          {conversation && user && user.uid === conversation.buyerId && textbook?.status === 'available' && !conversation.transactionStatus && (
            <Card className="bg-blue-50 border-blue-200 mt-2">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 text-sm">💬 販売許可待ち</h4>
                  <p className="text-xs text-blue-800 mb-2">
                    出品者との相談後、販売許可が出た場合に購入が可能になります。
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed text-xs px-3 py-1 h-7 w-full"
                    disabled={true}
                  >
                    <CreditCard className="mr-1 h-3 w-3" />
                    購入する（許可待ち）
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


          {/* 購入者向け決済・受取表示 */}
          {conversation && user && user.uid === conversation.buyerId && (conversation.transactionStatus === 'selected' || conversation.transactionStatus === 'paid' || conversation.transactionStatus === 'completed') && (
            <Card className="bg-green-50 border-green-200 mt-2">
              <CardContent className="p-3">
                {conversation.transactionStatus === 'completed' ? (
                  <div className="text-center">
                    <h4 className="font-medium text-green-900 text-sm mb-1">✅ 取引完了</h4>
                    <p className="text-xs text-green-800">
                      取引が完了しました。ありがとうございました！
                    </p>
                  </div>
                ) : conversation.transactionStatus === 'paid' ? (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-900 text-sm">💳 決済完了</h4>
                    <p className="text-xs text-green-800 mb-2">
                      決済が完了しました。商品を受け取ったら下のボタンを押してください。
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
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-900 text-sm">🎉 取引成立！</h4>
                    <p className="text-xs text-green-800 mb-2">
                      あなたとの取引が成立しました。決済を行ってください。
                    </p>
                    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7 w-full"
                          onClick={handlePayment}
                          disabled={paymentLoading}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          {paymentLoading ? '準備中...' : `¥${textbook.price?.toLocaleString()}で決済`}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="pb-2">
                          <DialogTitle>決済情報の入力</DialogTitle>
                        </DialogHeader>
                        {clientSecret && (
                          <div className="overflow-y-auto max-h-[70vh] px-1">
                            <StripePaymentForm
                              clientSecret={clientSecret}
                              amount={textbook.price}
                              textbookTitle={textbook.title}
                              onSuccess={handlePaymentSuccess}
                            />
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* メッセージエリア */}
      <main ref={messagesContainerRef} className="flex-1 container mx-auto px-4 py-2 overflow-y-auto min-h-0">
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
                  {!isCurrentUser && !msg.isSystemMessage && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={userProfile?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-muted text-xs">
                        {userProfile?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {msg.isSystemMessage && (
                    <div className="flex items-center justify-center w-8 h-8 mt-1 bg-blue-100 rounded-full">
                      <span className="text-xs text-blue-600">🔔</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${isCurrentUser ? 'text-right' : 'text-left'} ${msg.isSystemMessage ? 'max-w-[90%]' : ''}`}>
                    <div className={`text-xs text-muted-foreground mb-1 ${isCurrentUser ? 'text-right' : 'text-left'} flex items-center gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <span>{msg.isSystemMessage ? "システム" : (userProfile?.name || (isCurrentUser ? "あなた" : "不明"))}</span>
                      {!msg.isSystemMessage && (
                        <OfficialIcon 
                          isOfficial={userProfile?.isOfficial} 
                          officialType={userProfile?.officialType as 'admin' | 'support' | 'team'} 
                          className="scale-75"
                        />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-2xl ${
                        msg.isSystemMessage
                          ? "bg-blue-50 border border-blue-200 text-blue-800"
                          : isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        msg.isSystemMessage 
                          ? 'text-blue-600 justify-start'
                          : isCurrentUser 
                          ? 'text-primary-foreground/70 justify-end' 
                          : 'text-muted-foreground justify-start'
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
                  
                  {isCurrentUser && !msg.isSystemMessage && (
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
          {/* スクロール用の空のdiv */}
          <div ref={messagesEndRef} />
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
