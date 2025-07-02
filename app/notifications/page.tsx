"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, MessageSquare, ShoppingCart, Info, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/useAuth"
import { 
  getUserNotifications, 
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  type Notification 
} from "@/lib/notifications"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import Link from "next/link"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { user } = useAuth()
  const router = useRouter()

  // 通知をリアルタイムで監視
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications)
      setLoading(false)
    })

    return unsubscribe
  }, [user, router])

  // 通知アイコンを取得
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'transaction':
        return <ShoppingCart className="h-5 w-5 text-green-500" />
      case 'system':
        return <Info className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // 日時をフォーマット
  const formatNotificationTime = (createdAt: any) => {
    if (!createdAt) return ""
    
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "たった今"
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 通知をクリックした時の処理
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 未読の場合は既読にする
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id)
      }

      // 関連ページに遷移
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
      }
    } catch (error) {
      console.error("通知クリックエラー:", error)
    }
  }

  // 通知を削除
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error("通知削除エラー:", error)
    }
  }

  // 選択した通知を既読にする
  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length === 0) return

    try {
      await markNotificationsAsRead(selectedIds)
      setSelectedIds([])
    } catch (error) {
      console.error("一括既読エラー:", error)
    }
  }

  // すべての未読通知を既読にする
  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return
    
    try {
      await markAllNotificationsAsRead(user.uid)
      setSelectedIds([])
    } catch (error) {
      console.error("全既読エラー:", error)
    }
  }

  // 全選択/全解除
  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map(n => n.id))
    }
  }

  // 選択状態を切り替え
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">通知</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                未読 {unreadCount}件
              </p>
            )}
          </div>
        </div>

        {/* 操作ボタン */}
        {notifications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedIds.length === notifications.length ? "全解除" : "全選択"}
            </Button>
            
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-1" />
                すべて既読 ({unreadCount})
              </Button>
            )}
            
            {selectedIds.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkSelectedAsRead}
              >
                <Check className="h-4 w-4 mr-1" />
                選択項目を既読 ({selectedIds.length})
              </Button>
            )}
          </div>
        )}

        {/* 通知一覧 */}
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">通知はありません</h3>
                <p className="text-muted-foreground">
                  新しい通知があるとここに表示されます
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.isRead ? "bg-blue-50/50 border-blue-200" : ""
                } ${
                  selectedIds.includes(notification.id) ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 選択チェックボックス */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={() => handleToggleSelect(notification.id)}
                      className="mt-2"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* 通知アイコン */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* 通知内容 */}
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNotification(notification.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                        
                        <Badge variant="outline" className="text-xs">
                          {notification.type === 'message' && 'メッセージ'}
                          {notification.type === 'transaction' && '取引'}
                          {notification.type === 'system' && 'システム'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* フッターリンク */}
        {notifications.length === 0 && (
          <div className="text-center mt-8">
            <Link href="/marketplace">
              <Button variant="outline">
                教科書を探す
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}