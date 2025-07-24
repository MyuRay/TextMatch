"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { getDashboardStats, verifyWithStripe } from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Book, MessageSquare, TrendingUp, Shield, Settings, FileText, AlertTriangle, DollarSign, Banknote, CheckCircle, AlertCircle, Flag } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalUsers: number
  totalBooks: number
  totalMessages: number
  activeTransactions: number
  recentSignups: number
  flaggedContent: number
  totalTransactionAmount: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBooks: 0,
    totalMessages: 0,
    activeTransactions: 0,
    recentSignups: 0,
    flaggedContent: 0,
    totalTransactionAmount: 0,
    totalRevenue: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // 管理者権限チェック
  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin(userProfile)) {
        alert('管理者権限が必要です')
        router.push('/')
        return
      }
    } else if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, userProfile, loading, router])

  // 統計データを取得
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error('統計データ取得エラー:', error)
        // エラー時はデフォルト値を設定
        setStats({
          totalUsers: 0,
          totalBooks: 0,
          totalMessages: 0,
          activeTransactions: 0,
          recentSignups: 0,
          flaggedContent: 0,
          totalTransactionAmount: 0,
          totalRevenue: 0
        })
      } finally {
        setIsLoadingStats(false)
      }
    }

    if (user && isAdmin(userProfile)) {
      fetchStats()
    }
  }, [user, userProfile])

  // Stripe照合処理
  const handleStripeVerification = async () => {
    setIsVerifying(true)
    try {
      const result = await verifyWithStripe()
      setVerificationResult(result)
      if (result.success) {
        alert(`照合完了: ${result.data.summary.discrepancyCount}件の不整合が見つかりました`)
      } else {
        alert(`照合エラー: ${result.error}`)
      }
    } catch (error) {
      console.error('Stripe照合エラー:', error)
      alert('照合処理中にエラーが発生しました')
    } finally {
      setIsVerifying(false)
    }
  }

  if (loading || (user && !isAdmin(userProfile))) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
            <Badge variant="destructive" className="ml-2">ADMIN</Badge>
          </div>
          <p className="text-muted-foreground">
            TextMatchプラットフォームの管理と監視
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '-' : stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.recentSignups} 今週の新規登録
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総出品数</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '-' : stats.totalBooks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                教科書・参考書の出品
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総メッセージ数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '-' : stats.totalMessages.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ユーザー間のやり取り
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">進行中取引</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '-' : stats.activeTransactions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                決済〜受取完了まで
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">要確認コンテンツ</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isLoadingStats ? '-' : stats.flaggedContent}
              </div>
              <p className="text-xs text-muted-foreground">
                通報・フラグ済み
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合計取引金額</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoadingStats ? '-' : `¥${stats.totalTransactionAmount.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                決済完了した取引の総額
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合計収益</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoadingStats ? '-' : `¥${stats.totalRevenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                取引手数料 (6.4%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">システム状態</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">正常</div>
              <p className="text-xs text-muted-foreground">
                全システム稼働中
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stripe照合セクション */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Stripe決済データ照合
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button 
                onClick={handleStripeVerification}
                disabled={isVerifying}
                className="flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    照合中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Stripeと照合
                  </>
                )}
              </Button>
              
              {verificationResult && (
                <div className="flex-1">
                  {verificationResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {verificationResult.data.summary.discrepancyCount === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="text-sm">
                          照合結果: {verificationResult.data.summary.discrepancyCount === 0 ? '問題なし' : `${verificationResult.data.summary.discrepancyCount}件の不整合`}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <div>Firestore: {verificationResult.data.summary.firestoreCount}件</div>
                          <div>¥{verificationResult.data.summary.firestoreTotal.toLocaleString()}</div>
                        </div>
                        <div>
                          <div>Stripe: {verificationResult.data.summary.stripeCount}件</div>
                          <div>¥{verificationResult.data.summary.stripeTotal.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {verificationResult.data.summary.discrepancyCount > 0 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-medium">詳細を表示</summary>
                          <div className="mt-2 space-y-1 text-xs">
                            {verificationResult.data.discrepancies.map((disc: any, index: number) => (
                              <div key={index} className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                                <div className="font-medium">{disc.type}</div>
                                <div className="text-muted-foreground">{disc.details}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">エラー: {verificationResult.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 管理メニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ユーザー管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                ユーザーアカウントの管理、権限設定、アカウント停止など
              </p>
              <Link href="/admin/users">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                出品管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                教科書出品の管理、不適切コンテンツの削除、カテゴリ管理
              </p>
              <Link href="/admin/books">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                メッセージ監視
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                ユーザー間のメッセージ監視、スパム検出、通報処理
              </p>
              <Link href="/admin/messages">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                取引管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                決済状況の確認、トラブル対応、返金処理など
              </p>
              <Link href="/admin/transactions">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                レポート・分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                利用統計、売上レポート、ユーザー行動分析
              </p>
              <Link href="/admin/reports">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                通報管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                ユーザー通報の確認・対応、不適切行為の管理
              </p>
              <Link href="/admin/reports-management">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                システム設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                アプリケーション設定、メンテナンス、バックアップ
              </p>
              <Link href="/admin/settings">
                <Button className="w-full">管理画面を開く</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}