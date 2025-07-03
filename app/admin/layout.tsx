"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Shield,
  Home,
  LogOut
} from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading, signOut } = useAuth()
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return
      
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const adminCheck = await isAdmin(user)
        setHasAdminAccess(adminCheck)
        
        if (!adminCheck) {
          router.push("/")
          return
        }
      } catch (error) {
        console.error("管理者権限チェックエラー:", error)
        router.push("/")
        return
      }
      
      setLoading(false)
    }

    checkAdminAccess()
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">認証確認中...</p>
        </div>
      </div>
    )
  }

  if (!hasAdminAccess) {
    return null // リダイレクト処理中
  }

  const navigationItems = [
    { href: "/admin", label: "ダッシュボード", icon: BarChart3 },
    { href: "/admin/users", label: "ユーザー管理", icon: Users },
    { href: "/admin/books", label: "教科書管理", icon: BookOpen },
    { href: "/admin/security", label: "セキュリティ", icon: Shield },
    { href: "/admin/settings", label: "設定", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* サイドバー */}
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <Badge variant="secondary" className="text-xs">管理者</Badge>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className="w-full justify-start h-10"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>

          <div className="mt-8 pt-4 border-t">
            <Button
              variant="ghost"
              asChild
              className="w-full justify-start h-10 mb-2"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-3" />
                サイトに戻る
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-3" />
              ログアウト
            </Button>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}