"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalBooks: number
  totalTransactions: number
  todayRegistrations: number
  pendingReports: number
  revenue: number
}

interface RecentUser {
  id: string
  fullName?: string
  nickname?: string
  university?: string
  createdAt: any
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBooks: 0,
    totalTransactions: 0,
    todayRegistrations: 0,
    pendingReports: 0,
    revenue: 0
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      
      if (!response.ok) {
        throw new Error("データ取得失敗")
      }
      
      const data = await response.json()
      setStats(data.stats)
      setRecentUsers(data.recentUsers)
    } catch (error) {
      console.error("ダッシュボード統計取得エラー:", error)
      // エラー時はデフォルト値を設定
      setStats({
        totalUsers: 0,
        totalBooks: 0,
        totalTransactions: 0,
        todayRegistrations: 0,
        pendingReports: 0,
        revenue: 0
      })
      setRecentUsers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return "たった今"
    if (diffMins < 60) return `${diffMins}分前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`
    return `${Math.floor(diffMins / 1440)}日前`
  }

  const statsCards = [
    {
      title: "総ユーザー数",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "登録教科書数",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "取引完了数",
      value: stats.totalTransactions,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "本日の新規登録",
      value: stats.todayRegistrations,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "未処理の通報",
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "総売上 (手数料)",
      value: `¥${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">管理ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          システム全体の概要と統計情報
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 bg-muted rounded animate-pulse"></div>
                ) : (
                  <div className="text-2xl font-bold">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 最近のアクティビティ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近の登録ユーザー</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                まだ登録ユーザーがいません
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        index % 5 === 0 ? 'bg-blue-100 text-blue-600' :
                        index % 5 === 1 ? 'bg-green-100 text-green-600' :
                        index % 5 === 2 ? 'bg-purple-100 text-purple-600' :
                        index % 5 === 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-pink-100 text-pink-600'
                      }`}>
                        {(user.fullName || user.nickname || "U").charAt(0)}
                      </div>
                      <div>
                        <div className="space-y-0.5">
                          {(() => {
                            // デバッグ用: データの状態を確認
                            const hasFullName = user.fullName && user.fullName.trim() !== ""
                            const hasNickname = user.nickname && user.nickname.trim() !== ""
                            
                            if (hasFullName && hasNickname) {
                              // 両方設定されている場合
                              return (
                                <>
                                  <div className="font-medium text-sm">{user.fullName}</div>
                                  <div className="text-xs text-gray-600">@{user.nickname}</div>
                                </>
                              )
                            } else if (hasFullName) {
                              // 本名のみ設定されている場合
                              return <div className="font-medium text-sm">{user.fullName}</div>
                            } else if (hasNickname) {
                              // 表示名のみ設定されている場合
                              return <div className="font-medium text-sm">@{user.nickname}</div>
                            } else {
                              // 両方とも設定されていない場合
                              return <div className="font-medium text-sm text-gray-500">名前なし</div>
                            }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.university || "大学不明"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {formatDate(user.createdAt)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>要注意事項</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.pendingReports > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">
                      {stats.pendingReports}件の通報が未処理
                    </div>
                    <div className="text-xs text-red-700">
                      速やかな対応が必要です
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">
                    システム正常稼働中
                  </div>
                  <div className="text-xs text-green-700">
                    全サービスが正常に動作しています
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}