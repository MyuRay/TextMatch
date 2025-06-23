"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/useAuth"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseAuth"
import { Heart, MessageSquare, Menu, X } from "lucide-react"

export function Header() {
  const { user, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/" // ログアウト後にトップへリダイレクト
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

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
              <Link href="/messages" className="hover:underline flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                メッセージ
              </Link>
              <Link href="/mypage">
                <Button variant="outline" size="sm">マイページ</Button>
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
                <Link href="/messages" className="hover:underline flex items-center gap-2 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageSquare className="h-4 w-4" />
                  メッセージ
                </Link>
                <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">マイページ</Button>
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
