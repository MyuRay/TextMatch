"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { getBookDetails, updateBookDetails, AdminBookProfile } from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  ChevronLeft, 
  Edit, 
  Save, 
  X, 
  User, 
  Calendar, 
  Eye, 
  DollarSign,
  Package,
  Database,
  Shield
} from "lucide-react"
import Link from "next/link"

export default function BookDetailPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string
  
  const [bookDetails, setBookDetails] = useState<AdminBookProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 編集用フォームデータ
  const [editData, setEditData] = useState({
    title: '',
    author: '',
    price: 0,
    condition: '',
    description: '',
    status: 'available' as 'available' | 'reserved' | 'sold',
    transactionStatus: undefined as 'pending' | 'paid' | 'completed' | undefined,
    isApproved: true,
    adminNotes: '',
    category: '',
    isbn: '',
    publisher: '',
    year: undefined as number | undefined
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

  // 出品詳細データ読み込み
  useEffect(() => {
    const loadBookDetails = async () => {
      if (!user || !isAdmin(userProfile) || !bookId) return
      
      try {
        setIsLoading(true)
        const details = await getBookDetails(bookId)
        if (details) {
          setBookDetails(details)
          setEditData({
            title: details.title,
            author: details.author,
            price: details.price,
            condition: details.condition,
            description: details.description,
            status: details.status,
            transactionStatus: details.transactionStatus,
            isApproved: details.isApproved || false,
            adminNotes: details.adminNotes || '',
            category: details.category || '',
            isbn: details.isbn || '',
            publisher: details.publisher || '',
            year: details.year
          })
        } else {
          alert('出品が見つかりません')
          router.push('/admin/books')
        }
      } catch (error) {
        console.error('出品詳細取得エラー:', error)
        alert('出品情報の取得に失敗しました')
        router.push('/admin/books')
      } finally {
        setIsLoading(false)
      }
    }

    loadBookDetails()
  }, [user, userProfile, bookId, router])

  // 保存処理
  const handleSave = async () => {
    if (!bookDetails) return
    
    setIsSaving(true)
    try {
      await updateBookDetails(bookId, editData)
      
      // ローカル状態を更新
      setBookDetails({
        ...bookDetails,
        ...editData
      })
      
      setIsEditing(false)
      alert('出品情報を更新しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // キャンセル処理
  const handleCancel = () => {
    if (!bookDetails) return
    
    setEditData({
      title: bookDetails.title,
      author: bookDetails.author,
      price: bookDetails.price,
      condition: bookDetails.condition,
      description: bookDetails.description,
      status: bookDetails.status,
      transactionStatus: bookDetails.transactionStatus,
      isApproved: bookDetails.isApproved || false,
      adminNotes: bookDetails.adminNotes || '',
      category: bookDetails.category || '',
      isbn: bookDetails.isbn || '',
      publisher: bookDetails.publisher || '',
      year: bookDetails.year
    })
    setIsEditing(false)
  }

  // 日付フォーマット
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '未設定'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ja-JP')
  }

  // ステータスバッジ
  const getStatusBadge = (status: string, transactionStatus?: string) => {
    if (status === 'sold' || transactionStatus === 'paid' || transactionStatus === 'completed') {
      return <Badge variant="destructive">売切済</Badge>
    }
    if (status === 'reserved') {
      return <Badge variant="secondary">予約済</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">販売中</Badge>
  }

  if (loading || isLoading || (user && !isAdmin(userProfile))) {
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

  if (!bookDetails) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">出品が見つかりません</h1>
            <Link href="/admin/books">
              <Button>出品管理に戻る</Button>
            </Link>
          </div>
        </main>
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
            <Link href="/admin/books">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                出品管理に戻る
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">出品詳細</h1>
                <p className="text-muted-foreground">ID: {bookDetails.id}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? '保存中...' : '保存'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    キャンセル
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メイン情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <img 
                    src={bookDetails.imageUrl || "/placeholder.svg"} 
                    alt={bookDetails.title} 
                    className="w-32 h-44 object-cover rounded flex-shrink-0" 
                  />
                  
                  <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-medium">タイトル</label>
                          <Input
                            value={editData.title}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">著者</label>
                          <Input
                            value={editData.author}
                            onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">価格</label>
                            <Input
                              type="number"
                              value={editData.price}
                              onChange={(e) => setEditData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">状態</label>
                            <Select value={editData.condition} onValueChange={(value) => setEditData(prev => ({ ...prev, condition: value }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="新品">新品</SelectItem>
                                <SelectItem value="美品">美品</SelectItem>
                                <SelectItem value="良好">良好</SelectItem>
                                <SelectItem value="可">可</SelectItem>
                                <SelectItem value="不可">不可</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h2 className="text-2xl font-bold">{bookDetails.title}</h2>
                          <p className="text-lg text-muted-foreground">{bookDetails.author}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-green-600">¥{bookDetails.price.toLocaleString()}</div>
                          <Badge variant="outline">{bookDetails.condition}</Badge>
                          {getStatusBadge(bookDetails.status, bookDetails.transactionStatus)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <label className="text-sm font-medium">説明</label>
                  {isEditing ? (
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{bookDetails.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 詳細情報 */}
            <Card>
              <CardHeader>
                <CardTitle>詳細情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">カテゴリ</label>
                      <Input
                        value={editData.category}
                        onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">ISBN</label>
                      <Input
                        value={editData.isbn}
                        onChange={(e) => setEditData(prev => ({ ...prev, isbn: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">出版社</label>
                      <Input
                        value={editData.publisher}
                        onChange={(e) => setEditData(prev => ({ ...prev, publisher: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">出版年</label>
                      <Input
                        type="number"
                        value={editData.year || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">カテゴリ</span>
                      <p className="text-sm">{bookDetails.category || '未設定'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ISBN</span>
                      <p className="text-sm">{bookDetails.isbn || '未設定'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">出版社</span>
                      <p className="text-sm">{bookDetails.publisher || '未設定'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">出版年</span>
                      <p className="text-sm">{bookDetails.year || '未設定'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Firestore詳細情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Firestore詳細情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">ドキュメントID</span>
                    <p className="font-mono text-xs bg-muted p-2 rounded mt-1">{bookDetails.id}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">出品者ID</span>
                    <p className="font-mono text-xs bg-muted p-2 rounded mt-1">{bookDetails.userId}</p>
                  </div>
                  
                  {bookDetails.buyerId && (
                    <div>
                      <span className="font-medium text-muted-foreground">購入者ID</span>
                      <p className="font-mono text-xs bg-muted p-2 rounded mt-1">{bookDetails.buyerId}</p>
                    </div>
                  )}
                  
                  {bookDetails.paymentIntentId && (
                    <div>
                      <span className="font-medium text-muted-foreground">PaymentIntentID</span>
                      <p className="font-mono text-xs bg-muted p-2 rounded mt-1">{bookDetails.paymentIntentId}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-muted-foreground">作成日時</span>
                    <p className="text-xs">{formatDate(bookDetails.createdAt)}</p>
                  </div>
                  
                  {bookDetails.updatedAt && (
                    <div>
                      <span className="font-medium text-muted-foreground">更新日時</span>
                      <p className="text-xs">{formatDate(bookDetails.updatedAt)}</p>
                    </div>
                  )}
                  
                  {bookDetails.paidAt && (
                    <div>
                      <span className="font-medium text-muted-foreground">決済日時</span>
                      <p className="text-xs">{formatDate(bookDetails.paidAt)}</p>
                    </div>
                  )}
                  
                  {bookDetails.completedAt && (
                    <div>
                      <span className="font-medium text-muted-foreground">完了日時</span>
                      <p className="text-xs">{formatDate(bookDetails.completedAt)}</p>
                    </div>
                  )}
                  
                  {bookDetails.deletedAt && (
                    <div>
                      <span className="font-medium text-muted-foreground">削除日時</span>
                      <p className="text-xs">{formatDate(bookDetails.deletedAt)}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-muted-foreground">閲覧数</span>
                    <p className="text-xs">{bookDetails.viewCount}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">通報数</span>
                    <p className="text-xs">{bookDetails.flaggedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* 出品者情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  出品者情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">名前</span>
                  <p className="text-sm">{bookDetails.sellerName}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">メールアドレス</span>
                  <p className="text-sm">{bookDetails.sellerEmail}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-muted-foreground">大学</span>
                  <p className="text-sm">{bookDetails.university}</p>
                </div>
                
                <Link href={`/admin/users/${bookDetails.userId}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Eye className="h-4 w-4 mr-2" />
                    ユーザー詳細
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 管理情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  管理情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">販売状態</label>
                      <Select value={editData.status} onValueChange={(value: any) => setEditData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">販売中</SelectItem>
                          <SelectItem value="reserved">予約済</SelectItem>
                          <SelectItem value="sold">売切済</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">取引状態</label>
                      <Select value={editData.transactionStatus || ''} onValueChange={(value) => setEditData(prev => ({ ...prev, transactionStatus: value as any || undefined }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="未設定" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">未設定</SelectItem>
                          <SelectItem value="pending">保留中</SelectItem>
                          <SelectItem value="paid">決済済</SelectItem>
                          <SelectItem value="completed">完了</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">承認状態</label>
                      <Select value={editData.isApproved.toString()} onValueChange={(value) => setEditData(prev => ({ ...prev, isApproved: value === 'true' }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">承認済</SelectItem>
                          <SelectItem value="false">承認待ち</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">管理者メモ</label>
                      <Textarea
                        value={editData.adminNotes}
                        onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                        className="mt-1"
                        rows={3}
                        placeholder="管理者用のメモを入力..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">販売状態</span>
                      <div className="mt-1">{getStatusBadge(bookDetails.status, bookDetails.transactionStatus)}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">取引状態</span>
                      <p className="text-sm mt-1">{bookDetails.transactionStatus || '未設定'}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">承認状態</span>
                      <div className="mt-1">
                        <Badge variant={bookDetails.isApproved ? "default" : "secondary"} className={bookDetails.isApproved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                          {bookDetails.isApproved ? '承認済' : '承認待ち'}
                        </Badge>
                      </div>
                    </div>
                    
                    {bookDetails.adminNotes && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">管理者メモ</span>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
                          <p className="text-sm text-yellow-700">{bookDetails.adminNotes}</p>
                        </div>
                      </div>
                    )}
                    
                    {bookDetails.deleteReason && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">削除理由</span>
                        <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                          <p className="text-sm text-red-700">{bookDetails.deleteReason}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* アクション */}
            <Card>
              <CardHeader>
                <CardTitle>アクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/marketplace/${bookDetails.id}`}>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    公開ページで確認
                  </Button>
                </Link>
                
                {bookDetails.paymentIntentId && (
                  <Button variant="outline" className="w-full" onClick={() => {
                    navigator.clipboard.writeText(bookDetails.paymentIntentId!)
                    alert('PaymentIntentIDをコピーしました')
                  }}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    PaymentIntentIDをコピー
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}