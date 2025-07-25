"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { 
  getDetailedAnalytics,
  DetailedAnalytics
} from "@/lib/adminFirestore"
import { getAccessStats, getPopularPages, AccessStats } from "@/lib/analytics"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ChevronLeft, 
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Target,
  Award,
  Clock,
  Download,
  Calendar,
  PieChart,
  Activity,
  Eye
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

export default function AdminReportsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null)
  const [accessStats, setAccessStats] = useState<AccessStats | null>(null)
  const [popularPages, setPopularPages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  // 管理者権限チェック
  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin(userProfile)) {
        alert('管理者権限が必要です')
        router.push('/admin')
        return
      }
    } else if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, userProfile, loading, router])

  // データ読み込み
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user || !isAdmin(userProfile)) return
      
      try {
        setIsLoading(true)
        
        // 日付範囲の計算
        const endDate = new Date()
        const startDate = new Date()
        switch (dateRange) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7)
            break
          case '30d':
            startDate.setDate(endDate.getDate() - 30)
            break
          case '90d':
            startDate.setDate(endDate.getDate() - 90)
            break
          default:
            startDate.setDate(endDate.getDate() - 30)
        }
        
        const [analyticsData, accessStatsData, popularPagesData] = await Promise.all([
          getDetailedAnalytics(startDate, endDate),
          getAccessStats(startDate, endDate),
          getPopularPages(10, startDate, endDate)
        ])
        
        setAnalytics(analyticsData)
        setAccessStats(accessStatsData)
        setPopularPages(popularPagesData)
      } catch (error) {
        console.error("分析データ読み込みエラー:", error)
        alert("分析データの読み込みに失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [user, userProfile, dateRange])

  // CSV エクスポート
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return
    
    const headers = Object.keys(data[0]).join(',')
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">分析データを読み込み中...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-6">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground">分析データの読み込みに失敗しました</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            {/* ヘッダー */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">管理画面に戻る</span>
                    <span className="sm:hidden">戻る</span>
                  </Link>
                </Button>
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="hidden sm:inline">レポート・分析</span>
                    <span className="sm:hidden">分析</span>
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                    プラットフォームの詳細分析とレポート
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm flex-1 sm:flex-none"
                >
                  <option value="7d">過去7日</option>
                  <option value="30d">過去30日</option>
                  <option value="90d">過去90日</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportToCSV(analytics.dailyStats, 'daily_stats')}
                  className="flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">エクスポート</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </div>
            </div>

            {/* KPI カード */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">総ユーザー数</p>
                      <p className="text-lg sm:text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 self-end sm:self-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">総出品数</p>
                      <p className="text-lg sm:text-2xl font-bold">{analytics.totalBooks.toLocaleString()}</p>
                    </div>
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 self-end sm:self-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">総取引数</p>
                      <p className="text-lg sm:text-2xl font-bold">{analytics.totalTransactions.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 self-end sm:self-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">総収益</p>
                      <p className="text-lg sm:text-2xl font-bold">¥{analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 self-end sm:self-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">総PV</p>
                      <p className="text-lg sm:text-2xl font-bold">{accessStats?.totalPageViews.toLocaleString() || '0'}</p>
                    </div>
                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 self-end sm:self-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* タブ */}
            <Tabs defaultValue="overview" className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="grid w-full grid-cols-6 min-w-max">
                  <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">概要</span>
                  </TabsTrigger>
                  <TabsTrigger value="access" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">アクセス</span>
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm hidden sm:inline">売上分析</span>
                    <span className="text-xs sm:hidden">売上</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm hidden sm:inline">ユーザー分析</span>
                    <span className="text-xs sm:hidden">ユーザー</span>
                  </TabsTrigger>
                  <TabsTrigger value="universities" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm hidden sm:inline">大学別分析</span>
                    <span className="text-xs sm:hidden">大学</span>
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm hidden sm:inline">パフォーマンス</span>
                    <span className="text-xs sm:hidden">性能</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* 概要タブ */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* 時系列グラフ */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">日次アクティビティ推移</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analytics.dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            fontSize={12}
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis fontSize={12} tick={{ fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              fontSize: '12px',
                              padding: '8px',
                              border: '1px solid #ccc',
                              borderRadius: '4px'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '12px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#8884d8" 
                            name="ユーザー"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="books" 
                            stroke="#82ca9d" 
                            name="出品"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="transactions" 
                            stroke="#ffc658" 
                            name="取引"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* 累積統計推移 */}
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">累積統計推移</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={(() => {
                          let cumulativeUsers = 0
                          let cumulativeBooks = 0
                          let cumulativeTransactions = 0
                          return analytics.dailyStats.map(day => {
                            cumulativeUsers += day.users
                            cumulativeBooks += day.books
                            cumulativeTransactions += day.transactions
                            return {
                              date: day.date,
                              cumulativeUsers,
                              cumulativeBooks,
                              cumulativeTransactions
                            }
                          })
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            fontSize={10}
                            tick={{ fontSize: 9 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis fontSize={10} tick={{ fontSize: 9 }} />
                          <Tooltip 
                            contentStyle={{ 
                              fontSize: '11px',
                              padding: '6px',
                              border: '1px solid #ccc',
                              borderRadius: '4px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Area 
                            type="monotone" 
                            dataKey="cumulativeUsers" 
                            stackId="1"
                            stroke="#8884d8" 
                            fill="url(#usersGradient)" 
                            name="累積ユーザー"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cumulativeBooks" 
                            stackId="2"
                            stroke="#82ca9d" 
                            fill="url(#booksGradient)" 
                            name="累積出品"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cumulativeTransactions" 
                            stackId="3"
                            stroke="#ffc658" 
                            fill="url(#transactionsGradient)" 
                            name="累積取引"
                          />
                          <defs>
                            <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="booksGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="transactionsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* 価格分布 */}
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">価格分布</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.transactionAnalysis.priceDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="range" 
                            fontSize={10}
                            tick={{ fontSize: 9 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis fontSize={10} tick={{ fontSize: 9 }} />
                          <Tooltip 
                            contentStyle={{ 
                              fontSize: '11px',
                              padding: '6px',
                              border: '1px solid #ccc',
                              borderRadius: '4px'
                            }}
                          />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* カテゴリ別売上 */}
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">カテゴリ別出品数</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {analytics.categoryStats.slice(0, 5).map((category, index) => (
                          <div key={category.category} className="flex justify-between items-center">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div 
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-xs sm:text-sm truncate">{category.category}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs sm:text-sm font-medium">{category.count}件</span>
                              <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded">
                                <div 
                                  className="h-2 rounded" 
                                  style={{
                                    width: `${(category.count / Math.max(...analytics.categoryStats.map(c => c.count))) * 100}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* アクセス分析タブ */}
              <TabsContent value="access" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* アクセス統計 */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        アクセス統計
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">
                            {accessStats?.totalPageViews.toLocaleString() || '0'}
                          </p>
                          <p className="text-sm text-muted-foreground">総PV数</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {accessStats?.uniqueVisitors.toLocaleString() || '0'}
                          </p>
                          <p className="text-sm text-muted-foreground">ユニーク訪問者</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {accessStats && accessStats.totalPageViews > 0 ? 
                              Math.round(accessStats.totalPageViews / accessStats.uniqueVisitors * 100) / 100 : '0'}
                          </p>
                          <p className="text-sm text-muted-foreground">平均PV/訪問</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {accessStats?.topPages.length || '0'}
                          </p>
                          <p className="text-sm text-muted-foreground">アクセス済みページ</p>
                        </div>
                      </div>
                      
                      {/* 日別アクセス推移 */}
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={accessStats?.dailyStats || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="views" stroke="#8884d8" name="PV数" />
                          <Line type="monotone" dataKey="uniqueVisitors" stroke="#82ca9d" name="ユニーク訪問者" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* 人気ページランキング */}
                  <Card>
                    <CardHeader>
                      <CardTitle>人気ページランキング</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {popularPages.slice(0, 10).map((page, index) => (
                          <div key={page.path} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{page.title || page.path}</p>
                                <p className="text-xs text-muted-foreground">{page.path}</p>
                              </div>
                            </div>
                            <span className="font-bold text-primary">{page.views}PV</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 時間別アクセス */}
                  <Card>
                    <CardHeader>
                      <CardTitle>時間別アクセス分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={accessStats?.hourlyStats || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="views" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 売上分析タブ */}
              <TabsContent value="sales" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>日次収益推移</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`¥${value}`, '収益']} />
                          <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>カテゴリ別売上</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.categoryStats.slice(0, 5).map((category, index) => (
                          <div key={category.category} className="flex justify-between items-center">
                            <span className="text-sm">{category.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">¥{category.totalRevenue.toLocaleString()}</span>
                              <div className="w-20 h-2 bg-gray-200 rounded">
                                <div 
                                  className="h-2 rounded" 
                                  style={{
                                    width: `${(category.totalRevenue / Math.max(...analytics.categoryStats.map(c => c.totalRevenue))) * 100}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>累積収益推移</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={(() => {
                          let cumulative = 0
                          return analytics.dailyStats.map(day => {
                            cumulative += day.revenue
                            return {
                              date: day.date,
                              cumulativeRevenue: cumulative
                            }
                          })
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '累積収益']} />
                          <Area 
                            type="monotone" 
                            dataKey="cumulativeRevenue" 
                            stroke="#10b981" 
                            fill="url(#cumulativeGradient)" 
                          />
                          <defs>
                            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>平均価格分析</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">全体平均価格</span>
                          <span className="font-medium">
                            ¥{analytics.totalTransactions > 0 ? 
                              Math.round((analytics.totalRevenue / 0.064) / analytics.totalTransactions).toLocaleString() : 
                              0}
                          </span>
                        </div>
                        {analytics.categoryStats.slice(0, 3).map(category => (
                          <div key={category.category} className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{category.category}</span>
                            <span className="font-medium">¥{Math.round(category.averagePrice).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ユーザー分析タブ */}
              <TabsContent value="users" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        トップセラー
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.userBehavior.topSellerStats.slice(0, 5).map((seller, index) => (
                          <div key={seller.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{seller.name}</p>
                                <p className="text-xs text-muted-foreground">{seller.totalSales}件の販売</p>
                              </div>
                            </div>
                            <span className="font-bold text-green-600">¥{seller.totalRevenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        トップバイヤー
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.userBehavior.topBuyerStats.slice(0, 5).map((buyer, index) => (
                          <div key={buyer.userId} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{buyer.name}</p>
                                <p className="text-xs text-muted-foreground">{buyer.totalPurchases}件の購入</p>
                              </div>
                            </div>
                            <span className="font-bold text-blue-600">¥{buyer.totalSpent.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>ユーザー行動統計</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">
                            {analytics.userBehavior.averageListingsPerUser.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">平均出品数/人</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {analytics.userBehavior.averagePurchasesPerUser.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">平均購入数/人</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.userBehavior.topSellerStats.length}
                          </p>
                          <p className="text-sm text-muted-foreground">アクティブセラー</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {analytics.userBehavior.topBuyerStats.length}
                          </p>
                          <p className="text-sm text-muted-foreground">アクティブバイヤー</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 大学別分析タブ */}
              <TabsContent value="universities" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">大学別統計</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* モバイル用カード表示 */}
                    <div className="sm:hidden space-y-3">
                      {analytics.universityStats.slice(0, 10).map((university) => (
                        <div key={university.university} className="border rounded-lg p-3 bg-gray-50">
                          <div className="font-medium text-sm mb-2 truncate">{university.university}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ユーザー数</span>
                              <span className="font-medium">{university.userCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">出品数</span>
                              <span className="font-medium">{university.bookCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">取引数</span>
                              <span className="font-medium">{university.transactionCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">平均価格</span>
                              <span className="font-medium">¥{Math.round(university.averagePrice).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* デスクトップ用テーブル表示 */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm">大学名</th>
                            <th className="text-right p-2 text-sm">ユーザー数</th>
                            <th className="text-right p-2 text-sm">出品数</th>
                            <th className="text-right p-2 text-sm">取引数</th>
                            <th className="text-right p-2 text-sm">平均価格</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.universityStats.slice(0, 10).map((university) => (
                            <tr key={university.university} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium text-sm">{university.university}</td>
                              <td className="p-2 text-right text-sm">{university.userCount}</td>
                              <td className="p-2 text-right text-sm">{university.bookCount}</td>
                              <td className="p-2 text-right text-sm">{university.transactionCount}</td>
                              <td className="p-2 text-right text-sm">¥{Math.round(university.averagePrice).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* パフォーマンスタブ */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>取引完了時間</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {analytics.transactionAnalysis.averageCompletionTime.toFixed(1)}日
                        </p>
                        <p className="text-muted-foreground">平均完了時間</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>大学別完了率</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.transactionAnalysis.completionRateByUniversity.slice(0, 5).map((university) => (
                          <div key={university.university} className="flex justify-between items-center">
                            <span className="text-sm">{university.university}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{university.completionRate.toFixed(1)}%</span>
                              <div className="w-16 h-2 bg-gray-200 rounded">
                                <div 
                                  className="h-2 bg-green-500 rounded" 
                                  style={{ width: `${university.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}