"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/useAuth"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseAuth"
import { Heart, MessageSquare } from "lucide-react"

export function Header() {
  const { user, loading } = useAuth()

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/" // ログアウト後にトップへリダイレクト
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="text-xl font-bold">
        TextMatch
      </Link>

      <nav className="flex gap-4 items-center">
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
            <Link href="/messages" className="hover:underline flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              メッセージ
            </Link>
            <Link href="/mypage">
              <Button variant="outline">マイページ</Button>
            </Link>
            <Button onClick={handleLogout} className="bg-red-500 text-white">
              ログアウト
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="outline">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button>登録</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
