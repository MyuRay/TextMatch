"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { getUserDetails, updateUserAccountStatus, updateUserOfficialStatus, AdminUserProfile } from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Users, 
  ChevronLeft, 
  Mail, 
  School, 
  Calendar, 
  User, 
  Shield, 
  UserX, 
  UserCheck, 
  Book, 
  MessageSquare,
  Clock,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

export default function UserDetailPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [userDetails, setUserDetails] = useState<AdminUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
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

  // ユーザー詳細データ読み込み
  useEffect(() => {
    const loadUserDetails = async () => {
      if (!user || !isAdmin(userProfile) || !userId) return
      
      try {
        setIsLoading(true)
        const details = await getUserDetails(userId)
        setUserDetails(details)
      } catch (error) {
        console.error('ユーザー詳細取得エラー:', error)
        alert('ユーザー情報の取得に失敗しました')
        router.push('/admin/users')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserDetails()
  }, [user, userProfile, userId, router])

  // アカウント停止/復活
  const handleAccountAction = async (userId: string, action: 'suspend' | 'activate') => {
    try {
      const newStatus = action === 'suspend' ? 'suspended' : 'active'
      await updateUserAccountStatus(userId, newStatus, `管理者による${action === 'suspend' ? '停止' : '復活'}`)
      
      // ローカル状態を更新
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          accountStatus: newStatus
        })
      }
      
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
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          isOfficial,
          officialType: isOfficial ? 'team' : undefined
        })
      }
      
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
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (isLoading) {
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

  if (!userDetails) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">ユーザーが見つかりません</h1>
            <p className="text-muted-foreground mb-6">指定されたユーザーは存在しないか削除されています。</p>
            <Link href="/admin/users">
              <Button>ユーザー一覧に戻る</Button>
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
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                ユーザー一覧に戻る
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">ユーザー詳細</h1>
          </div>
          <p className="text-muted-foreground">
            ユーザーの詳細情報と管理操作
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 基本情報 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userDetails.avatarUrl} />
                    <AvatarFallback className="text-lg">{userDetails.fullName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{userDetails.fullName}</h2>
                        {userDetails.nickname && (
                          <span className="text-lg text-muted-foreground">(@{userDetails.nickname})</span>
                        )}
                        {userDetails.isOfficial && (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            公式
                          </Badge>
                        )}
                      </div>
                      {getStatusBadge(userDetails.accountStatus)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{userDetails.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{userDetails.university}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">登録日: {formatDate(userDetails.createdAt)}</span>
                      </div>
                      
                      {userDetails.lastLoginAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">最終ログイン: {formatDate(userDetails.lastLoginAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 活動統計 */}
            <Card>
              <CardHeader>
                <CardTitle>活動統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Book className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold">{userDetails.createdBooksCount || 0}</div>
                    <div className="text-sm text-muted-foreground">出品数</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold">{userDetails.completedTransactionsCount || 0}</div>
                    <div className="text-sm text-muted-foreground">完了取引数</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <MessageSquare className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <div className="text-2xl font-bold">-</div>
                    <div className="text-sm text-muted-foreground">メッセージ数</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold">-</div>
                    <div className="text-sm text-muted-foreground">評価数</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 管理操作 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>管理操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* アカウント状態変更 */}
                <div>
                  <h3 className="font-medium mb-2">アカウント状態</h3>
                  {userDetails.accountStatus === 'active' ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setActionDialog({
                        isOpen: true,
                        type: 'suspend',
                        user: userDetails
                      })}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      アカウント停止
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => setActionDialog({
                        isOpen: true,
                        type: 'activate',
                        user: userDetails
                      })}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      アカウント復活
                    </Button>
                  )}
                </div>

                <Separator />

                {/* 公式アカウント設定 */}
                <div>
                  <h3 className="font-medium mb-2">公式アカウント</h3>
                  {!userDetails.isOfficial ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActionDialog({
                        isOpen: true,
                        type: 'makeOfficial',
                        user: userDetails
                      })}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      公式アカウントに設定
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActionDialog({
                        isOpen: true,
                        type: 'removeOfficial',
                        user: userDetails
                      })}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      公式アカウント解除
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* アカウント情報 */}
            <Card>
              <CardHeader>
                <CardTitle>アカウント情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">ユーザーID</span>
                  <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded mt-1">
                    {userDetails.id}
                  </div>
                </div>
                
                {userDetails.officialType && (
                  <div>
                    <span className="text-sm font-medium">公式タイプ</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      {userDetails.officialType}
                    </div>
                  </div>
                )}
                
                {userDetails.statusReason && (
                  <div>
                    <span className="text-sm font-medium">状態変更理由</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      {userDetails.statusReason}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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