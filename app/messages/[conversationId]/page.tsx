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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, User, BookOpen, Clock, CheckCircle, RotateCcw, CreditCard, Flag, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [otherUserId, setOtherUserId] = useState<string>("")
  const [textbook, setTextbook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [agreedToReport, setAgreedToReport] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
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
        
        setOtherUserId(otherUserId)
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

  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!newMessage.trim() || !user || isSending) return

    console.log("🔄 メッセージ送信開始...")
    setIsSending(true)
    
    const messageToSend = newMessage
    setNewMessage("") // メッセージ送信前に入力欄をクリア
    
    // Textareaの高さをリセット
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.style.height = 'auto'
    }

    try {
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: messageToSend,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        isRead: false,
      })
      
      // メール通知を送信
      try {
        await sendMessageNotification(messageToSend)
      } catch (error) {
        console.error("メール通知エラー:", error)
      }
      
      // 統合された通知を送信（プッシュ通知 + アプリ内通知）
      try {
        await sendUnifiedNotification(messageToSend)
      } catch (error) {
        console.error("統合通知エラー:", error)
      }
      
      // メッセージ送信後、少し遅れてスクロール
      setTimeout(() => {
        scrollToBottom()
      }, 100)
      
      console.log("✅ メッセージ送信完了")
    } catch (error) {
      console.error("❌ メッセージ送信エラー:", error)
      alert("メッセージの送信に失敗しました")
      setNewMessage(messageToSend) // エラー時は元のメッセージを復元
    } finally {
      setIsSending(false) // 送信状態を解除
      console.log("🔓 送信ロック解除")
    }
  }

  const sendMessageNotification = async (messageText: string) => {
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
      const messagePreview = messageText.length > 50 
        ? messageText.substring(0, 50) + "..." 
        : messageText

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

  // 統合通知関数（プッシュ通知 + アプリ内通知を同時実行し、重複を防ぐ）
  const sendUnifiedNotification = async (messageText: string) => {
    const callId = Date.now()
    console.log(`🔔 [${callId}] 統合通知開始 - メッセージ: "${messageText.substring(0, 20)}..."`)
    
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
      
      console.log(`📤 [${callId}] 送信先: ${recipientId}, 送信者: ${user.uid}`)
      
      // 送信者の名前
      const senderName = currentUserProfile.name || "ユーザー"
      
      // メッセージプレビュー（最初の30文字）
      const messagePreview = messageText.length > 30 
        ? messageText.substring(0, 30) + "..." 
        : messageText

      // 通知データ
      const notificationData = {
        type: 'message',
        conversationId: conversationId as string,
        bookId: textbook.id,
        bookTitle: textbook.title,
        recipientId
      }

      // プッシュ通知とアプリ内通知を並行実行（ただし重複防止のためタグを共有）
      console.log(`🚀 [${callId}] プッシュ通知 & アプリ内通知送信開始`)
      
      const results = await Promise.allSettled([
        // プッシュ通知
        sendPushNotification(
          recipientId,
          `${senderName}からメッセージ`,
          `${textbook.title}: ${messagePreview}`,
          notificationData
        ),
        // アプリ内通知
        createMessageNotification(
          recipientId,
          senderName,
          textbook.title,
          conversationId as string
        )
      ])
      
      console.log(`✅ [${callId}] 通知送信完了 - 結果:`, results.map(r => r.status))

    } catch (error) {
      console.error(`❌ [${callId}] 統合通知送信エラー:`, error)
      // 通知エラーでもメッセージ送信は継続
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
      console.log("🔄 決済完了処理開始")
      console.log("教科書ID:", textbook.id)
      console.log("購入者ID:", conversation.buyerId)
      
      // 会話の取引状態をpaidに更新
      const conversationRef = doc(db, "conversations", conversationId as string)
      await updateDoc(conversationRef, {
        transactionStatus: 'paid', // 決済完了
        paidAt: serverTimestamp(),
      })
      console.log("✅ 会話ステータス更新完了")
      
      // 教科書の状態をsoldに更新し、取引状態もpaidに更新
      const textbookRef = doc(db, "books", textbook.id)
      await updateDoc(textbookRef, {
        status: 'sold', // 決済完了時に売り切れにする
        buyerId: conversation.buyerId, // 購入者IDを設定
        transactionStatus: 'paid', // 決済完了
        paidAt: serverTimestamp(),
      })
      console.log("✅ 教科書ステータス更新完了 - status: sold")
      
      // 会話の状態を更新
      setConversation((prev: any) => prev ? { 
        ...prev, 
        transactionStatus: 'paid'
      } : null)
      
      // 教科書の状態を更新
      setTextbook((prev: any) => prev ? { 
        ...prev, 
        status: 'sold',
        buyerId: conversation.buyerId,
        transactionStatus: 'paid'
      } : null)
      console.log("✅ ローカル状態更新完了")
      
      // 決済完了メッセージを自動送信（最新のニックネームを取得）
      const currentUserDoc = await getDoc(doc(db, "users", user!.uid))
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : null
      const displayName = currentUserData?.nickname || currentUserData?.fullName || '購入者'
      
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: `💳 ${displayName}さんが決済を完了しました。商品の受け渡しを行ってください。`,
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
      
      // 受取完了メッセージを自動送信（最新のニックネームを取得）
      const currentUserDoc = await getDoc(doc(db, "users", user.uid))
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : null
      const displayName = currentUserData?.nickname || currentUserData?.fullName || '購入者'
      
      const messagesRef = collection(db, "conversations", conversationId as string, "messages")
      await addDoc(messagesRef, {
        text: `✅ ${displayName}さんが商品を受け取りました。取引完了です！お疲れ様でした。\n\n📝 サービス向上のため、[アンケート](https://docs.google.com/forms/d/e/1FAIpQLSdoNDHtDrD6pjIDhqL7sed1xCUe-7wtDcNGijirRfw3vZVpMg/viewform?usp=header)にご協力ください`,
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

  // 通報処理
  const handleReport = async () => {
    if (!reportReason || !agreedToReport) {
      alert("通報理由を選択し、利用規約に同意してください")
      return
    }

    setReportSubmitting(true)
    
    try {
      // 通報データを保存
      const reportData = {
        reporterId: user!.uid,
        reportedUserId: otherUserId,
        conversationId: conversationId,
        textbookId: textbook?.id,
        reason: reportReason,
        details: reportDetails,
        reporterName: currentUserProfile.name,
        reportedUserName: otherUser.name,
        textbookTitle: textbook?.title,
        createdAt: serverTimestamp(),
        status: 'pending',
        reviewed: false
      }

      await addDoc(collection(db, "reports"), reportData)

      // 管理者に通知を送信
      const adminNotificationData = {
        type: 'user_report',
        title: '新しい通報が届きました',
        message: `${currentUserProfile.name}さんから${otherUser.name}さんへの通報: ${reportReason}`,
        data: {
          reporterId: user!.uid,
          reportedUserId: otherUserId,
          conversationId: conversationId,
          reason: reportReason
        },
        createdAt: serverTimestamp(),
        isRead: false
      }

      await addDoc(collection(db, "admin_notifications"), adminNotificationData)

      alert("通報を受け付けました。内容を確認の上、適切に対応いたします。")
      setShowReportDialog(false)
      setReportReason("")
      setReportDetails("")
      setAgreedToReport(false)
    } catch (error) {
      console.error("通報エラー:", error)
      alert("通報の送信に失敗しました。しばらく時間をおいてお試しください。")
    } finally {
      setReportSubmitting(false)
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
              <Link href={`/seller/${otherUserId}`}>
                <Avatar className="h-10 w-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={otherUser?.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {otherUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
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
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {conversation && (
                  <Badge variant={conversation.buyerId === user?.uid ? 'default' : 'secondary'}>
                    {conversation.buyerId === user?.uid ? '購入希望' : '出品者'}
                  </Badge>
                )}
                
                {/* 通報ボタン */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportDialog(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  通報
                </Button>
              </div>
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
        </div>
      )}

      {/* 購入者向け販売許可待ち表示 - 固定位置 */}
      {conversation && user && user.uid === conversation.buyerId && textbook?.status === 'available' && !conversation.transactionStatus && (
        <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-2">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="relative">
                  <div className="space-y-2 pr-16">
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
                  
                  {/* 右上のアクションボタン */}
                  <div className="absolute top-0 right-0 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReportDialog(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1 h-6"
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('購入をキャンセルしますか？\n\nこの会話から退出し、他の教科書を探すことができます。')) {
                          router.push('/marketplace')
                        }
                      }}
                      className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs px-2 py-1 h-6"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {textbook && (
        <div className="container mx-auto px-4">
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
                      <p className="text-sm text-green-800 text-center font-medium whitespace-pre-wrap">{msg.text}</p>
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
                    <Link href={`/seller/${otherUserId}`}>
                      <Avatar className="h-8 w-8 mt-1 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={userProfile?.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback className="bg-muted text-xs">
                          {userProfile?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
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
                      <p className="text-sm text-left whitespace-pre-wrap">{msg.text}</p>
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
                    <Link href="/mypage">
                      <Avatar className="h-8 w-8 mt-1 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={userProfile?.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {userProfile?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
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
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 min-h-[36px] max-h-32 resize-none"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 128) + 'px'
              }}
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || isSending} 
              size="sm" 
              className="min-h-[36px] self-end px-3"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </footer>

      {/* 通報ダイアログ */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              ユーザーを通報
            </DialogTitle>
            <DialogDescription>
              不適切な行為や取引トラブルを管理者に報告できます
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">通報理由 *</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="理由を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_show">約束の日時に現れず、連絡が取れない</SelectItem>
                  <SelectItem value="fraud">詐欺的行為（偽の商品情報、代金持ち逃げ等）</SelectItem>
                  <SelectItem value="harassment">嫌がらせ・迷惑行為</SelectItem>
                  <SelectItem value="external_contact">外部SNS・プラットフォームへの誘導</SelectItem>
                  <SelectItem value="inappropriate_language">不適切な言葉遣い・暴言</SelectItem>
                  <SelectItem value="fake_profile">なりすまし・偽プロフィール</SelectItem>
                  <SelectItem value="payment_issue">決済関連のトラブル</SelectItem>
                  <SelectItem value="violation">利用規約違反</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">詳細（任意）</label>
              <Textarea
                placeholder="具体的な状況や詳細があれば記入してください"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p><strong>重要な注意事項：</strong></p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>虚偽の通報は利用規約違反となります</li>
                    <li>通報内容は管理者が確認し、適切に対応します</li>
                    <li>緊急の場合は直接運営まで連絡してください</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="report-agreement" 
                checked={agreedToReport}
                onCheckedChange={(checked) => setAgreedToReport(checked as boolean)}
              />
              <label htmlFor="report-agreement" className="text-sm">
                上記の内容が事実であり、利用規約に同意します
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReportDialog(false)
                setReportReason("")
                setReportDetails("")
                setAgreedToReport(false)
              }}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleReport}
              disabled={!reportReason || !agreedToReport || reportSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {reportSubmitting ? "送信中..." : "通報する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
