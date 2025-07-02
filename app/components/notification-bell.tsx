"use client"

import { useState, useEffect } from "react"
import { Bell, X, MessageSquare, ShoppingCart, Info, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/useAuth"
import { 
  subscribeToNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification 
} from "@/lib/notifications"
import { useRouter } from "next/navigation"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // 未読通知数を計算
  const unreadCount = notifications.filter(n => !n.isRead).length

  // 通知をリアルタイムで監視
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications)
    })

    return unsubscribe
  }, [user])

  // 通知アイコンを取得
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'transaction':
        return <ShoppingCart className="h-4 w-4 text-green-500" />
      case 'system':
        return <Info className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
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

      setIsOpen(false)
    } catch (error) {
      console.error("通知クリックエラー:", error)
    }
  }

  // 通知を削除
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error("通知削除エラー:", error)
    }
  }

  // 一括既読処理
  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return
    
    try {
      await markAllNotificationsAsRead(user.uid)
    } catch (error) {
      console.error("一括既読エラー:", error)
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
      month: 'numeric', 
      day: 'numeric' 
    })
  }

  if (!user) return null

  return (
    <>
      {/* デスクトップ版: ドロップダウンメニュー */}
      <div className="hidden md:block">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">通知</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      一括既読
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push("/notifications")}
                      className="text-xs"
                    >
                      すべて見る
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">通知はありません</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-muted/50 cursor-pointer relative group ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 10 && (
              <div className="p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    router.push("/notifications")
                    setIsOpen(false)
                  }}
                >
                  すべての通知を見る ({notifications.length})
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* モバイル版: 常に表示される通知一覧 */}
      <div className="block md:hidden">
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    </>
  )
}