<<<<<<< HEAD
"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/useAuth"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseAuth"
import { getUserUnreadMessageCount, saveFCMToken } from "@/lib/firestore"
import { requestNotificationPermission, onForegroundMessage, showNotification } from "@/lib/firebaseMessaging"
import { Heart, MessageSquare, Menu, X, Bell, BellOff } from "lucide-react"

export function Header() {
  const { user, userProfile, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationEnabled, setNotificationEnabled] = useState(false)

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/" // ログアウト後にトップへリダイレクト
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleNotificationToggle = async () => {
    if (!notificationEnabled) {
      const token = await requestNotificationPermission()
      if (token && user) {
        try {
          await saveFCMToken(user.uid, token)
          setNotificationEnabled(true)
          console.log('通知が有効になりました')
        } catch (error) {
          console.error('FCMトークン保存エラー:', error)
        }
      }
    } else {
      setNotificationEnabled(false)
      console.log('通知が無効になりました')
    }
  }

  // 未読メッセージ数を定期的に取得
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const count = await getUserUnreadMessageCount(user.uid)
        setUnreadCount(count)
      } catch (error) {
        console.error("未読メッセージ数取得エラー:", error)
      }
    }

    fetchUnreadCount()
    
    // 30秒ごとに未読数を更新
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  // 通知の初期化とフォアグラウンドメッセージの処理
  useEffect(() => {
    if (!user) return

    // 通知許可状態をチェック
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted')
    }

    // フォアグラウンドメッセージの処理
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('フォアグラウンドメッセージ受信:', payload)
      
      // 通知表示
      if (payload.notification) {
        showNotification(
          payload.notification.title || '新着メッセージ',
          payload.notification.body || 'メッセージが届きました',
          '/messages'
        )
      }
      
      // 未読数を再取得
      const fetchUnreadCount = async () => {
        try {
          const count = await getUserUnreadMessageCount(user.uid)
          setUnreadCount(count)
        } catch (error) {
          console.error("未読メッセージ数取得エラー:", error)
        }
      }
      fetchUnreadCount()
    })

    return unsubscribe
  }, [user])

  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image
            src="/logo.png"
            alt="TextMatch Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="hidden sm:inline">TextMatch</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-4 items-center">
          <Link href="/" className="hover:underline">ホーム</Link>
          <Link href="/marketplace" className="hover:underline">出品一覧</Link>
          <Link href="/contact" className="hover:underline">お問い合わせ</Link>

          {/* 出品リンク（ログイン必須） */}
          {user ? (
            <Link href="/post-textbook" className="hover:underline">教科書を出品</Link>
          ) : (
            <Link href="/register" className="hover:underline">教科書を出品</Link>
          )}

          {!loading && user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationToggle}
                className="flex items-center gap-1"
                title={notificationEnabled ? "通知を無効にする" : "通知を有効にする"}
              >
                {notificationEnabled ? (
                  <Bell className="h-4 w-4 text-green-600" />
                ) : (
                  <BellOff className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Link href="/messages" className="hover:underline flex items-center gap-1 relative">
                <MessageSquare className="h-4 w-4" />
                メッセージ
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/mypage">
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-2 hover:bg-primary/5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={userProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(userProfile?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">マイページ</span>
                </Button>
              </Link>
              <Button onClick={handleLogout} size="sm" className="bg-red-500 text-white">
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">ログイン</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">登録</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="flex flex-col p-4 space-y-3">
            <Link href="/" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
              ホーム
            </Link>
            <Link href="/marketplace" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
              出品一覧
            </Link>
            <Link href="/contact" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
              お問い合わせ
            </Link>

            {/* 出品リンク（ログイン必須） */}
            {user ? (
              <Link href="/post-textbook" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
                教科書を出品
              </Link>
            ) : (
              <Link href="/register" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
                教科書を出品
              </Link>
            )}

            {!loading && user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleNotificationToggle}
                  className="w-full justify-start flex items-center gap-2 py-2"
                >
                  {notificationEnabled ? (
                    <>
                      <Bell className="h-4 w-4 text-green-600" />
                      <span>通知ON</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="h-4 w-4 text-gray-400" />
                      <span>通知OFF</span>
                    </>
                  )}
                </Button>
                <Link href="/messages" className="hover:underline flex items-center gap-2 py-2 relative" onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageSquare className="h-4 w-4" />
                  メッセージ
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-auto">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start flex items-center gap-3 border-2 hover:bg-primary/5">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={userProfile?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(userProfile?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">マイページ</span>
                  </Button>
                </Link>
                <Button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="bg-red-500 text-white w-full">
                  ログアウト
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">ログイン</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">登録</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
=======
"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/useAuth"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseAuth"
import { getUserUnreadMessageCount } from "@/lib/firestore"
import { requestNotificationPermission, saveFCMToken, setupForegroundMessageHandler } from "@/lib/firebaseMessaging"
import { Heart, MessageSquare, Menu, X, Bell, BellOff } from "lucide-react"

export function Header() {
  const { user, userProfile, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  // デバッグ用：ユーザー状態ログ
  useEffect(() => {
    const debugInfo = {
      user: user ? 'logged_in' : 'logged_out',
      userId: user?.uid,
      loading,
      userProfile: userProfile ? 'exists' : 'null',
      shouldShowNotificationButton: !loading && !!user,
      notificationsEnabled
    }
    console.log('🔔 Header - ユーザー状態:', debugInfo)
    
    // 強制的にアラートでも表示
    if (!loading && user) {
      console.log('✅ 通知ボタンを表示する条件が満たされています')
    } else {
      console.log('❌ 通知ボタンを表示しない理由:', { loading, user: !!user })
    }
  }, [user, loading, userProfile, notificationsEnabled])

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/" // ログアウト後にトップへリダイレクト
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleNotificationToggle = async () => {
    if (!user) return

    if (!notificationsEnabled) {
      const token = await requestNotificationPermission()
      if (token) {
        await saveFCMToken(user.uid, token)
        setNotificationsEnabled(true)
        setupForegroundMessageHandler()
      }
    } else {
      setNotificationsEnabled(false)
    }
  }

  // 未読メッセージ数を定期的に取得
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const count = await getUserUnreadMessageCount(user.uid)
        setUnreadCount(count)
      } catch (error) {
        console.error("未読メッセージ数取得エラー:", error)
      }
    }

    fetchUnreadCount()
    
    // 30秒ごとに未読数を更新
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  // 通知権限の初期状態を確認
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const isGranted = Notification.permission === 'granted'
      console.log('通知権限の初期状態:', Notification.permission, 'isGranted:', isGranted)
      setNotificationsEnabled(isGranted)
    } else {
      console.log('Notification API利用不可または非ブラウザ環境')
    }
  }, [])

  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image
            src="/logo.png"
            alt="TextMatch Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="hidden sm:inline">TextMatch</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-4 items-center">
          <Link href="/" className="hover:underline">ホーム</Link>
          <Link href="/marketplace" className="hover:underline">出品一覧</Link>
          <Link href="/contact" className="hover:underline">お問い合わせ</Link>

          {/* 出品リンク（ログイン必須） */}
          {user ? (
            <Link href="/post-textbook" className="hover:underline">教科書を出品</Link>
          ) : (
            <Link href="/register" className="hover:underline">教科書を出品</Link>
          )}

          {/* デバッグ用：通知ボタンを常に表示 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alert('デバッグ用通知ボタンクリック')}
            className="flex items-center gap-1 bg-blue-500 text-white"
            style={{ backgroundColor: 'blue', color: 'white' }}
          >
            <Bell className="h-4 w-4" />
            <span className="text-sm">デバッグ</span>
          </Button>

          {!loading && user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationToggle}
                className="flex items-center gap-1 bg-red-100 border-2 border-red-500"
                title={`通知機能 - ユーザー: ${user?.uid}, 権限: ${notificationsEnabled ? 'ON' : 'OFF'}`}
                style={{ minWidth: '80px', backgroundColor: 'red', color: 'white' }}
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {notificationsEnabled ? '通知ON' : '通知OFF'}
                </span>
              </Button>
              <Link href="/messages" className="hover:underline flex items-center gap-1 relative">
                <MessageSquare className="h-4 w-4" />
                メッセージ
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/mypage">
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-2 hover:bg-primary/5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={userProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(userProfile?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">マイページ</span>
                </Button>
              </Link>
              <Button onClick={handleLogout} size="sm" className="bg-red-500 text-white">
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">ログイン</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">登録</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="flex flex-col p-4 space-y-3">
            <Link href="/" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
              ホーム
            </Link>
            <Link href="/marketplace" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
              出品一覧
            </Link>
            <Link href="/contact" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
              お問い合わせ
            </Link>

            {/* 出品リンク（ログイン必須） */}
            {user ? (
              <Link href="/post-textbook" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
                教科書を出品
              </Link>
            ) : (
              <Link href="/register" className="hover:underline py-2" onClick={() => setIsMobileMenuOpen(false)}>
                教科書を出品
              </Link>
            )}

            {!loading && user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleNotificationToggle}
                  className="justify-start flex items-center gap-2 py-2 w-full"
                >
                  {notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                  {notificationsEnabled ? '通知ON' : '通知OFF'}
                </Button>
                <Link href="/messages" className="hover:underline flex items-center gap-2 py-2 relative" onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageSquare className="h-4 w-4" />
                  メッセージ
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-auto">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start flex items-center gap-3 border-2 hover:bg-primary/5">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={userProfile?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(userProfile?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">マイページ</span>
                  </Button>
                </Link>
                <Button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="bg-red-500 text-white w-full">
                  ログアウト
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">ログイン</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">登録</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
>>>>>>> feature/push-notifications
