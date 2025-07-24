"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { 
  getAllTransactions,
  getTransactionStats,
  updateTransactionStatus,
  getProblematicTransactions,
  AdminTransaction,
  TransactionStats
} from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ChevronLeft, 
  TrendingUp, 
  Search, 
  Filter,
  AlertTriangle,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminTransactionsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<AdminTransaction[]>([])
  const [problematicTransactions, setProblematicTransactions] = useState<AdminTransaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all")
  const [updateReason, setUpdateReason] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
    const loadData = async () => {
      if (!user || !isAdmin(userProfile)) return
      
      try {
        setIsLoading(true)
        setIsLoadingStats(true)
        
        const [transactionResult, statsResult, problematicResult] = await Promise.all([
          getAllTransactions(100), // 最初の100件を取得
          getTransactionStats(),
          getProblematicTransactions()
        ])
        
        setTransactions(transactionResult.transactions)
        setFilteredTransactions(transactionResult.transactions)
        setStats(statsResult)
        setProblematicTransactions(problematicResult)
      } catch (error) {
        console.error("データ読み込みエラー:", error)
        alert("データの読み込みに失敗しました")
      } finally {
        setIsLoading(false)
        setIsLoadingStats(false)
      }
    }

    loadData()
  }, [user, userProfile])

  // フィルター処理
  useEffect(() => {
    let filtered = [...transactions]

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx =>
        tx.bookTitle.toLowerCase().includes(query) ||
        tx.buyerName.toLowerCase().includes(query) ||
        tx.sellerName.toLowerCase().includes(query) ||
        tx.university?.toLowerCase().includes(query)
      )
    }

    // ステータスフィルター
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // 取引ステータスフィルター
    if (transactionStatusFilter !== "all") {
      filtered = filtered.filter(tx => tx.transactionStatus === transactionStatusFilter)
    }

    setFilteredTransactions(filtered)
  }, [searchQuery, statusFilter, transactionStatusFilter, transactions])

  // 取引状態更新
  const handleUpdateTransaction = async (
    bookId: string, 
    status: 'available' | 'reserved' | 'sold',
    transactionStatus?: 'pending' | 'paid' | 'completed'
  ) => {
    if (!updateReason.trim()) {
      alert("更新理由を入力してください")
      return
    }

    try {
      setUpdatingId(bookId)
      await updateTransactionStatus(bookId, status, transactionStatus, updateReason)
      
      // ローカル状態を更新
      setTransactions(prev => prev.map(tx => 
        tx.id === bookId 
          ? { ...tx, status, transactionStatus: transactionStatus || tx.transactionStatus }
          : tx
      ))
      
      setUpdateReason("")
      alert("取引状態を更新しました")
    } catch (error) {
      console.error("取引状態更新エラー:", error)
      alert("取引状態の更新に失敗しました")
    } finally {
      setUpdatingId(null)
    }
  }

  // ステータスバッジの取得
  const getStatusBadge = (status: string, transactionStatus?: string) => {
    if (status === 'sold') {
      switch (transactionStatus) {
        case 'completed':
          return <Badge className="bg-green-100 text-green-800">✅ 完了</Badge>
        case 'paid':
          return <Badge className="bg-blue-100 text-blue-800">💳 決済済み</Badge>
        case 'pending':
        default:
          return <Badge className="bg-yellow-100 text-yellow-800">⏳ 保留中</Badge>
      }
    } else if (status === 'reserved') {
      return <Badge className="bg-orange-100 text-orange-800">📝 予約中</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">📖 出品中</Badge>
    }
  }

  // 日付フォーマット
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '未設定'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ja-JP')
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
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    管理画面に戻る
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    取引管理
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    取引の監視・管理・統計表示
                  </p>
                </div>
              </div>
            </div>

            {/* 統計カード */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">総取引数</p>
                        <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">総取引額</p>
                        <p className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">完了率</p>
                        <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">総収益</p>
                        <p className="text-2xl font-bold">¥{stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* タブ */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">全取引</TabsTrigger>
                <TabsTrigger value="problematic" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  問題のある取引 ({problematicTransactions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {/* 検索・フィルター */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="教科書名、ユーザー名、大学名で検索..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="ステータス" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全て</SelectItem>
                          <SelectItem value="available">出品中</SelectItem>
                          <SelectItem value="reserved">予約中</SelectItem>
                          <SelectItem value="sold">売却済み</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="取引状態" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全て</SelectItem>
                          <SelectItem value="pending">保留中</SelectItem>
                          <SelectItem value="paid">決済済み</SelectItem>
                          <SelectItem value="completed">完了</SelectItem>
                        </SelectContent>
                      </Select>

                      <Badge variant="secondary" className="self-start">
                        {filteredTransactions.length}件の取引
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 取引一覧 */}
                <Card>
                  <CardHeader>
                    <CardTitle>取引一覧</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {searchQuery || statusFilter !== "all" || transactionStatusFilter !== "all"
                            ? "検索条件に一致する取引が見つかりませんでした"
                            : "まだ取引がありません"}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredTransactions.map((transaction) => (
                          <div key={transaction.id} className="p-4 hover:bg-muted/50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-1 truncate">
                                  📚 {transaction.bookTitle}
                                </h3>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                                  <span>💰 ¥{transaction.bookPrice.toLocaleString()}</span>
                                  <span>🏪 {transaction.sellerName}</span>
                                  {transaction.buyerName !== "未購入" && (
                                    <span>👤 {transaction.buyerName}</span>
                                  )}
                                  {transaction.university && (
                                    <span>🏫 {transaction.university}</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  出品: {formatDate(transaction.createdAt)}
                                  {transaction.purchasedAt && (
                                    <span> | 購入: {formatDate(transaction.purchasedAt)}</span>
                                  )}
                                  {transaction.completedAt && (
                                    <span> | 完了: {formatDate(transaction.completedAt)}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 ml-4">
                                {getStatusBadge(transaction.status, transaction.transactionStatus)}
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/admin/books/${transaction.bookId}`}>
                                      <Eye className="h-3 w-3 mr-1" />
                                      詳細
                                    </Link>
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="secondary"
                                        disabled={updatingId === transaction.id}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        状態変更
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>取引状態の変更</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          取引の状態を手動で変更します。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      
                                      <div className="space-y-4">
                                        <div>
                                          <label className="text-sm font-medium">変更理由 *</label>
                                          <Textarea
                                            placeholder="状態変更の理由を入力してください..."
                                            value={updateReason}
                                            onChange={(e) => setUpdateReason(e.target.value)}
                                            className="mt-1"
                                          />
                                        </div>
                                        
                                        <div className="bg-muted p-3 rounded-lg">
                                          <p className="text-sm">
                                            <strong>対象取引:</strong> {transaction.bookTitle}
                                          </p>
                                          <p className="text-sm">
                                            <strong>現在の状態:</strong> {transaction.status} / {transaction.transactionStatus}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setUpdateReason("")}>
                                          キャンセル
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleUpdateTransaction(
                                            transaction.id, 
                                            'sold', 
                                            'completed'
                                          )}
                                          disabled={!updateReason.trim() || updatingId === transaction.id}
                                        >
                                          {updatingId === transaction.id ? "更新中..." : "完了にする"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="problematic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      問題のある取引
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {problematicTransactions.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          現在、問題のある取引はありません
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          30日以上未完了の取引が {problematicTransactions.length} 件あります
                        </p>
                        <div className="divide-y">
                          {problematicTransactions.map((transaction) => (
                            <div key={transaction.id} className="py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{transaction.bookTitle}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.sellerName} → {transaction.buyerName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    購入日: {formatDate(transaction.purchasedAt)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {getStatusBadge(transaction.status, transaction.transactionStatus)}
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/admin/books/${transaction.bookId}`}>
                                      詳細確認
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}