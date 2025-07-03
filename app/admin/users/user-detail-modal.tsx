"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  ShoppingCart,
  Shield,
  Ban,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

interface UserDetailModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
}

interface UserDetail {
  user: any
  stats: {
    totalBooks: number
    totalTransactions: number
    activeBooks: number
    soldBooks: number
  }
  books: any[]
  transactions: any[]
}

export function UserDetailModal({ 
  userId, 
  isOpen, 
  onClose, 
  onUserUpdated 
}: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetail()
    }
  }, [userId, isOpen])

  const fetchUserDetail = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) throw new Error("データ取得失敗")
      
      const data = await response.json()
      setUserDetail(data)
    } catch (error) {
      console.error("ユーザー詳細取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (action: string) => {
    if (!userId) return
    
    // 確認ダイアログを表示
    const confirmMessages = {
      suspend: 'このユーザーのアカウントを停止しますか？',
      activate: 'このユーザーのアカウントを有効化しますか？',
      ban: 'このユーザーのアカウントを禁止しますか？\n※この操作は慎重に行ってください',
      make_official: 'このユーザーに公式バッジを付与しますか？',
      remove_official: 'このユーザーの公式バッジを削除しますか？'
    }

    const confirmMessage = confirmMessages[action as keyof typeof confirmMessages]
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        // 成功メッセージ
        const successMessages = {
          suspend: 'ユーザーを停止しました',
          activate: 'ユーザーを有効化しました',
          ban: 'ユーザーを禁止しました',
          make_official: '公式バッジを付与しました',
          remove_official: '公式バッジを削除しました'
        }
        
        const successMessage = successMessages[action as keyof typeof successMessages]
        if (successMessage) {
          alert(successMessage)
        }
        
        await fetchUserDetail() // データを再取得
        onUserUpdated() // 親コンポーネントの一覧も更新
      } else {
        const errorData = await response.json()
        alert(`操作に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("ユーザー操作エラー:", error)
      alert('操作中にエラーが発生しました')
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ja-JP')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suspended': return 'text-orange-600'
      case 'banned': return 'text-red-600'
      case 'active': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (!userDetail && !loading) {
    return null
  }

  const user = userDetail?.user

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ユーザー詳細</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* ユーザー基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="text-lg">
                      {user.fullName?.charAt(0) || user.nickname?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="space-y-2">
                      {(() => {
                        // デバッグ用: データの状態を確認
                        const hasFullName = user.fullName && user.fullName.trim() !== ""
                        const hasNickname = user.nickname && user.nickname.trim() !== ""
                        
                        if (hasFullName && hasNickname) {
                          // 両方設定されている場合
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900">{user.fullName}</h3>
                                <Badge variant="outline" className="text-xs">本名</Badge>
                                {user.isOfficial && (
                                  <Shield className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-base text-gray-600">{user.nickname}</span>
                                <Badge variant="secondary" className="text-xs">表示名</Badge>
                              </div>
                            </>
                          )
                        } else if (hasFullName) {
                          // 本名のみ設定されている場合
                          return (
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">{user.fullName}</h3>
                              <Badge variant="outline" className="text-xs">本名</Badge>
                              {user.isOfficial && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          )
                        } else if (hasNickname) {
                          // 表示名のみ設定されている場合
                          return (
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">{user.nickname}</h3>
                              <Badge variant="secondary" className="text-xs">表示名</Badge>
                              {user.isOfficial && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          )
                        } else {
                          // 両方とも設定されていない場合
                          return (
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-500">名前なし</h3>
                              {user.isOfficial && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          )
                        }
                      })()}
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">大学:</span>
                        <span className="ml-2">{user.university || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">学年:</span>
                        <span className="ml-2">{user.grade || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">登録日:</span>
                        <span className="ml-2">{formatDate(user.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ステータス:</span>
                        <span className={`ml-2 font-medium ${getStatusColor(user.status || 'active')}`}>
                          {user.status === 'suspended' ? '停止中' : 
                           user.status === 'banned' ? '禁止' : 'アクティブ'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 統計情報 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{userDetail.stats.totalBooks}</div>
                  <div className="text-sm text-muted-foreground">登録教科書</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ShoppingCart className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{userDetail.stats.totalTransactions}</div>
                  <div className="text-sm text-muted-foreground">取引回数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{userDetail.stats.activeBooks}</div>
                  <div className="text-sm text-muted-foreground">販売中</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{userDetail.stats.soldBooks}</div>
                  <div className="text-sm text-muted-foreground">売切</div>
                </CardContent>
              </Card>
            </div>

            {/* 管理者操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">管理者操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* ステータス変更ボタン */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">アカウントステータス</h4>
                    <div className="flex gap-2 flex-wrap">
                      {user.status === 'active' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('suspend')}
                            className="text-orange-600 border-orange-300"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            アカウント停止
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('ban')}
                            className="text-red-600 border-red-300"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            アカウント禁止
                          </Button>
                        </>
                      ) : user.status === 'suspended' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('activate')}
                            className="text-green-600 border-green-300"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            停止解除
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction('ban')}
                            className="text-red-600 border-red-300"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            アカウント禁止
                          </Button>
                        </>
                      ) : user.status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('activate')}
                          className="text-green-600 border-green-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          禁止解除
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('activate')}
                          className="text-green-600 border-green-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          アクティブ化
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 公式バッジ管理 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">公式バッジ</h4>
                    <div className="flex gap-2">
                      {!user.isOfficial ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('make_official')}
                          className="text-blue-600 border-blue-300"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          公式バッジ付与
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction('remove_official')}
                          className="text-gray-600 border-gray-300"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          公式バッジ削除
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* その他の操作 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">コミュニケーション</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300"
                      onClick={() => alert('メール送信機能は今後実装予定です')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      メール送信
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 詳細タブ */}
            <Tabs defaultValue="books" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="books">登録教科書</TabsTrigger>
                <TabsTrigger value="transactions">取引履歴</TabsTrigger>
              </TabsList>
              
              <TabsContent value="books" className="space-y-4">
                {userDetail.books.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    登録された教科書がありません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userDetail.books.map((book: any) => (
                      <Card key={book.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-16 bg-muted rounded flex-shrink-0">
                              {book.imageUrls?.[0] && (
                                <img 
                                  src={book.imageUrls[0]} 
                                  alt={book.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{book.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {book.author} | ¥{book.price?.toLocaleString()}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={book.status === 'sold' ? 'destructive' : 'secondary'}>
                                  {book.status === 'sold' ? '売切' : '販売中'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(book.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4">
                {userDetail.transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    取引履歴がありません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userDetail.transactions.map((transaction: any) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant={transaction.type === 'buy' ? 'default' : 'secondary'}>
                                {transaction.type === 'buy' ? '購入' : '販売'}
                              </Badge>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">ユーザー情報を取得できませんでした</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}