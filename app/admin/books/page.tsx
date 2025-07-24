"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { 
  getBooks, 
  getBookStats, 
  updateBookApprovalStatus, 
  deleteBook, 
  AdminBookProfile 
} from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Book, 
  ChevronLeft, 
  Search, 
  Filter, 
  Check, 
  X, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Package,
  TrendingUp,
  Clock,
  Flag
} from "lucide-react"
import Link from "next/link"
import { QueryDocumentSnapshot } from "firebase/firestore"

interface BookStats {
  totalBooks: number
  availableBooks: number
  soldBooks: number
  pendingApproval: number
  flaggedBooks: number
  booksThisWeek: number
}

export default function AdminBooksPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  
  const [books, setBooks] = useState<AdminBookProfile[]>([])
  const [stats, setStats] = useState<BookStats>({
    totalBooks: 0,
    availableBooks: 0,
    soldBooks: 0,
    pendingApproval: 0,
    flaggedBooks: 0,
    booksThisWeek: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [approvalFilter, setApprovalFilter] = useState<string>("all")
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>()
  const [hasMore, setHasMore] = useState(true)
  
  // アクション確認ダイアログ
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    type: 'approve' | 'reject' | 'delete'
    book: AdminBookProfile | null
    reason: string
  }>({
    isOpen: false,
    type: 'approve',
    book: null,
    reason: ''
  })

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

  // 初期データ読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !isAdmin(userProfile)) return
      
      try {
        setIsLoading(true)
        
        // 統計と出品一覧を並行取得
        const [statsData, booksData] = await Promise.all([
          getBookStats(),
          getBooks(20, undefined, {
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter as any : undefined,
            isApproved: approvalFilter === 'approved' ? true : approvalFilter === 'pending' ? false : undefined
          })
        ])
        
        setStats(statsData)
        setBooks(booksData.books)
        setLastDoc(booksData.lastDoc)
        setHasMore(booksData.books.length === 20)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [user, userProfile, searchTerm, statusFilter, approvalFilter])

  // さらに読み込み
  const loadMore = async () => {
    if (!hasMore || !lastDoc) return
    
    try {
      const booksData = await getBooks(20, lastDoc, {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        isApproved: approvalFilter === 'approved' ? true : approvalFilter === 'pending' ? false : undefined
      })
      
      setBooks(prev => [...prev, ...booksData.books])
      setLastDoc(booksData.lastDoc)
      setHasMore(booksData.books.length === 20)
    } catch (error) {
      console.error('追加読み込みエラー:', error)
    }
  }

  // 承認・非承認処理
  const handleApprovalAction = async (bookId: string, isApproved: boolean, notes?: string) => {
    try {
      await updateBookApprovalStatus(bookId, isApproved, notes)
      
      // ローカル状態を更新
      setBooks(prev => prev.map(book => 
        book.id === bookId ? { ...book, isApproved, adminNotes: notes || '' } : book
      ))
      
      alert(`出品を${isApproved ? '承認' : '非承認'}しました`)
    } catch (error) {
      console.error('承認操作エラー:', error)
      alert('操作に失敗しました')
    }
  }

  // 削除処理
  const handleDeleteBook = async (bookId: string, reason: string) => {
    try {
      // 確認ダイアログを追加
      const confirmDelete = confirm(
        `この操作は取り消せません。\n\n出品「${actionDialog.book?.title}」を完全に削除しますか？\n\n削除理由: ${reason}`
      )
      
      if (!confirmDelete) {
        return
      }
      
      await deleteBook(bookId, reason, user?.uid)
      
      // ローカル状態から削除
      setBooks(prev => prev.filter(book => book.id !== bookId))
      
      alert('出品を完全に削除しました')
      
      // 統計も更新
      try {
        const newStats = await getBookStats()
        setStats(newStats)
      } catch (statsError) {
        console.error('統計更新エラー:', statsError)
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert(`削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  // 日付フォーマット
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '不明'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ja-JP')
  }

  // ステータスバッジ
  const getStatusBadge = (status: string, transactionStatus?: string) => {
    // 売り切れ済み: status='sold' OR transactionStatus in ['paid', 'completed']
    if (status === 'sold' || transactionStatus === 'paid' || transactionStatus === 'completed') {
      return <Badge variant="destructive">売切済</Badge>
    }
    if (status === 'reserved') {
      return <Badge variant="secondary">予約済</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">販売中</Badge>
  }

  // 承認状態バッジ
  const getApprovalBadge = (isApproved: boolean) => {
    return isApproved ? (
      <Badge variant="default" className="bg-green-100 text-green-800">承認済</Badge>
    ) : (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">承認待ち</Badge>
    )
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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                管理画面に戻る
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Book className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">出品管理</h1>
          </div>
          <p className="text-muted-foreground">
            教科書出品の管理、承認、監視
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">総出品数</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.availableBooks}</div>
              <p className="text-xs text-muted-foreground">販売中</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.soldBooks}</div>
              <p className="text-xs text-muted-foreground">売切済</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">承認待ち</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.flaggedBooks}</div>
              <p className="text-xs text-muted-foreground">通報あり</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{stats.booksThisWeek}</div>
              <p className="text-xs text-muted-foreground">今週の出品</p>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルタ */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="タイトル、著者、出品者名、大学名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="ステータスでフィルタ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  <SelectItem value="available">販売中</SelectItem>
                  <SelectItem value="reserved">予約済</SelectItem>
                  <SelectItem value="sold">売切済</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="承認状態でフィルタ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="approved">承認済</SelectItem>
                  <SelectItem value="pending">承認待ち</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 出品一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>出品一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                条件に一致する出品が見つかりません
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {books.map((book) => (
                    <div key={book.id} className="flex gap-4 p-4 border rounded-lg">
                      <img 
                        src={book.imageUrl || "/placeholder.svg"} 
                        alt={book.title} 
                        className="w-20 h-28 object-cover rounded flex-shrink-0" 
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg truncate">{book.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                            <p className="text-lg font-semibold text-green-600">¥{book.price.toLocaleString()}</p>
                          </div>
                          
                          <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(book.status, book.transactionStatus)}
                            {getApprovalBadge(book.isApproved || false)}
                            {(book.flaggedCount ?? 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <Flag className="h-3 w-3 mr-1" />
                                通報{book.flaggedCount}件
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                          <div>出品者: {book.sellerName}</div>
                          <div>大学: {book.university}</div>
                          <div>状態: {book.condition}</div>
                          <div>出品日: {formatDate(book.createdAt)}</div>
                        </div>
                        
                        {book.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {book.description}
                          </p>
                        )}
                        
                        {book.adminNotes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                            <p className="text-xs font-medium text-yellow-800">管理者メモ:</p>
                            <p className="text-sm text-yellow-700">{book.adminNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 flex-wrap">
                          <Link href={`/admin/books/${book.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              詳細
                            </Button>
                          </Link>
                          
                          {!book.isApproved ? (
                            <>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => setActionDialog({
                                  isOpen: true,
                                  type: 'approve',
                                  book,
                                  reason: ''
                                })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                承認
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActionDialog({
                                  isOpen: true,
                                  type: 'reject',
                                  book,
                                  reason: ''
                                })}
                              >
                                <X className="h-4 w-4 mr-1" />
                                非承認
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                type: 'reject',
                                book,
                                reason: ''
                              })}
                            >
                              <X className="h-4 w-4 mr-1" />
                              承認取消
                            </Button>
                          )}
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setActionDialog({
                              isOpen: true,
                              type: 'delete',
                              book,
                              reason: ''
                            })}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button onClick={loadMore} variant="outline">
                      さらに読み込む
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 確認ダイアログ */}
        <AlertDialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog(prev => ({ ...prev, isOpen: false }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionDialog.type === 'approve' && '出品承認の確認'}
                {actionDialog.type === 'reject' && '出品非承認の確認'}
                {actionDialog.type === 'delete' && '出品削除の確認'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                出品「{actionDialog.book?.title}」に対して以下の操作を実行しますか？
                <br />
                {actionDialog.type === 'approve' && 'この出品を承認します。'}
                {actionDialog.type === 'reject' && 'この出品を非承認にします。'}
                {actionDialog.type === 'delete' && (
                  <span className="text-red-600 font-medium">
                    ⚠️ この出品をFirestoreから完全に削除します。この操作は取り消せません。
                    削除されたデータは復元できません。
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {(actionDialog.type === 'reject' || actionDialog.type === 'delete') && (
              <div className="my-4">
                <label className="text-sm font-medium mb-2 block">
                  {actionDialog.type === 'reject' ? '非承認理由' : '削除理由'}
                </label>
                <Textarea
                  placeholder={actionDialog.type === 'reject' ? '非承認の理由を入力してください' : '削除の理由を入力してください'}
                  value={actionDialog.reason}
                  onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full"
                />
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!actionDialog.book) return
                  
                  if (actionDialog.type === 'approve') {
                    handleApprovalAction(actionDialog.book.id, true)
                  } else if (actionDialog.type === 'reject') {
                    handleApprovalAction(actionDialog.book.id, false, actionDialog.reason)
                  } else if (actionDialog.type === 'delete') {
                    handleDeleteBook(actionDialog.book.id, actionDialog.reason)
                  }
                  
                  setActionDialog(prev => ({ ...prev, isOpen: false, reason: '' }))
                }}
                className={actionDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {actionDialog.type === 'delete' ? '完全削除' : '実行'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  )
}