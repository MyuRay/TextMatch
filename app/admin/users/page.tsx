"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { getUsers, getUserStats, updateUserAccountStatus, updateUserOfficialStatus, AdminUserProfile } from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Search, Filter, UserX, UserCheck, Shield, ChevronLeft, Eye } from "lucide-react"
import Link from "next/link"
import { QueryDocumentSnapshot } from "firebase/firestore"

interface UserStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  officialUsers: number
  recentSignups: number
}

export default function AdminUsersPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState<AdminUserProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    officialUsers: 0,
    recentSignups: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [officialFilter, setOfficialFilter] = useState<string>("all")
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>()
  const [hasMore, setHasMore] = useState(true)
  
  // アクション確認ダイアログ
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    type: 'suspend' | 'activate' | 'makeOfficial' | 'removeOfficial'
    user: AdminUserProfile | null
  }>({
    isOpen: false,
    type: 'suspend',
    user: null
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
        
        // 統計とユーザー一覧を並行取得
        const [statsData, usersData] = await Promise.all([
          getUserStats(),
          getUsers(20, undefined, {
            search: searchTerm || undefined,
            accountStatus: statusFilter !== 'all' ? statusFilter as any : undefined,
            isOfficial: officialFilter !== 'all' ? officialFilter === 'true' : undefined
          })
        ])
        
        setStats(statsData)
        setUsers(usersData.users)
        setLastDoc(usersData.lastDoc)
        setHasMore(usersData.users.length === 20)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [user, userProfile, searchTerm, statusFilter, officialFilter])

  // さらに読み込み
  const loadMore = async () => {
    if (!hasMore || !lastDoc) return
    
    try {
      const usersData = await getUsers(20, lastDoc, {
        search: searchTerm || undefined,
        accountStatus: statusFilter !== 'all' ? statusFilter as any : undefined,
        isOfficial: officialFilter !== 'all' ? officialFilter === 'true' : undefined
      })
      
      setUsers(prev => [...prev, ...usersData.users])
      setLastDoc(usersData.lastDoc)
      setHasMore(usersData.users.length === 20)
    } catch (error) {
      console.error('追加読み込みエラー:', error)
    }
  }

  // アカウント停止/復活
  const handleAccountAction = async (userId: string, action: 'suspend' | 'activate') => {
    try {
      const newStatus = action === 'suspend' ? 'suspended' : 'active'
      await updateUserAccountStatus(userId, newStatus, `管理者による${action === 'suspend' ? '停止' : '復活'}`)
      
      // ローカル状態を更新
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, accountStatus: newStatus } : u
      ))
      
      alert(`アカウントを${action === 'suspend' ? '停止' : '復活'}しました`)
    } catch (error) {
      console.error('アカウント操作エラー:', error)
      alert('操作に失敗しました')
    }
  }

  // 公式アカウント設定/解除
  const handleOfficialAction = async (userId: string, action: 'makeOfficial' | 'removeOfficial') => {
    try {
      const isOfficial = action === 'makeOfficial'
      await updateUserOfficialStatus(userId, isOfficial, isOfficial ? 'team' : undefined)
      
      // ローカル状態を更新
      setUsers(prev => prev.map(u => 
        u.id === userId ? { 
          ...u, 
          isOfficial,
          officialType: isOfficial ? 'team' : undefined 
        } : u
      ))
      
      alert(`公式アカウントを${isOfficial ? '設定' : '解除'}しました`)
    } catch (error) {
      console.error('公式アカウント操作エラー:', error)
      alert('操作に失敗しました')
    }
  }

  // 日付フォーマット
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '不明'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ja-JP')
  }

  // アカウント状態バッジ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">アクティブ</Badge>
      case 'suspended':
        return <Badge variant="destructive">停止中</Badge>
      case 'deleted':
        return <Badge variant="secondary">削除済み</Badge>
      default:
        return <Badge variant="outline">不明</Badge>
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
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">ユーザー管理</h1>
          </div>
          <p className="text-muted-foreground">
            ユーザーアカウントの管理と監視
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">総ユーザー数</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">アクティブ</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
              <p className="text-xs text-muted-foreground">停止中</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.officialUsers}</div>
              <p className="text-xs text-muted-foreground">公式アカウント</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.recentSignups}</div>
              <p className="text-xs text-muted-foreground">今週の新規</p>
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
                    placeholder="名前、メール、大学名で検索..."
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
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="suspended">停止中</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={officialFilter} onValueChange={setOfficialFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="アカウント種別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="true">公式アカウント</SelectItem>
                  <SelectItem value="false">一般アカウント</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ユーザー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                条件に一致するユーザーが見つかりません
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.fullName}</h3>
                            {user.nickname && (
                              <span className="text-sm text-muted-foreground">(@{user.nickname})</span>
                            )}
                            {user.isOfficial && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                公式
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email} • {user.university}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            登録日: {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(user.accountStatus)}
                        
                        <div className="flex gap-1">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {user.accountStatus === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                type: 'suspend',
                                user
                              })}
                            >
                              <UserX className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                type: 'activate',
                                user
                              })}
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          
                          {!user.isOfficial ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                type: 'makeOfficial',
                                user
                              })}
                            >
                              <Shield className="h-4 w-4 text-blue-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                type: 'removeOfficial',
                                user
                              })}
                            >
                              <Shield className="h-4 w-4 text-gray-400" />
                            </Button>
                          )}
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
                {actionDialog.type === 'suspend' && 'アカウント停止の確認'}
                {actionDialog.type === 'activate' && 'アカウント復活の確認'}
                {actionDialog.type === 'makeOfficial' && '公式アカウント設定の確認'}
                {actionDialog.type === 'removeOfficial' && '公式アカウント解除の確認'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                ユーザー「{actionDialog.user?.fullName}」に対して以下の操作を実行しますか？
                <br />
                {actionDialog.type === 'suspend' && 'アカウントを停止します。'}
                {actionDialog.type === 'activate' && 'アカウントを復活します。'}
                {actionDialog.type === 'makeOfficial' && '公式アカウントに設定します。'}
                {actionDialog.type === 'removeOfficial' && '公式アカウントを解除します。'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!actionDialog.user) return
                  
                  if (actionDialog.type === 'suspend' || actionDialog.type === 'activate') {
                    handleAccountAction(actionDialog.user.id, actionDialog.type)
                  } else {
                    handleOfficialAction(actionDialog.user.id, actionDialog.type)
                  }
                  
                  setActionDialog(prev => ({ ...prev, isOpen: false }))
                }}
              >
                実行
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  )
}