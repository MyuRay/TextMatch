"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserDetailModal } from "./user-detail-modal"

interface User {
  id: string
  fullName: string
  email: string
  university: string
  grade?: string
  nickname?: string
  avatarUrl?: string
  isOfficial?: boolean
  officialType?: string
  emailVerified?: boolean
  createdAt: any
  lastLoginAt?: any
  status?: 'active' | 'suspended' | 'banned'
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // フィルター状態
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  
  // モーダル状態
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, searchTerm, selectedUniversity, selectedStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedUniversity && { university: selectedUniversity }),
        ...(selectedStatus && { status: selectedStatus }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error("データ取得失敗")

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error("ユーザーデータ取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    if (action === 'view') {
      setSelectedUserId(userId)
      setIsModalOpen(true)
      return
    }

    if (action === 'email') {
      // メール送信機能（今後実装）
      alert('メール送信機能は今後実装予定です')
      return
    }

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
        
        fetchUsers() // データを再取得
      } else {
        const errorData = await response.json()
        alert(`操作に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("ユーザー操作エラー:", error)
      alert('操作中にエラーが発生しました')
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedUserId(null)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('ja-JP')
  }

  const getStatusBadge = (user: User) => {
    if (user.status === 'suspended') {
      return <Badge variant="destructive">停止中</Badge>
    }
    if (user.status === 'banned') {
      return <Badge variant="destructive">禁止</Badge>
    }
    if (user.isOfficial) {
      return <Badge variant="secondary">公式</Badge>
    }
    return <Badge variant="outline">一般</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
          <p className="text-muted-foreground mt-1">
            登録ユーザーの管理と監視
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          総ユーザー数: {pagination.total.toLocaleString()}人
        </div>
      </div>

      {/* 検索・フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            検索・フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="名前・メールで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedUniversity || "all"} onValueChange={(value) => setSelectedUniversity(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="大学で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての大学</SelectItem>
                <SelectItem value="東京大学">東京大学</SelectItem>
                <SelectItem value="早稲田大学">早稲田大学</SelectItem>
                <SelectItem value="慶應義塾大学">慶應義塾大学</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="active">アクティブ</SelectItem>
                <SelectItem value="suspended">停止中</SelectItem>
                <SelectItem value="banned">禁止</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setSelectedUniversity("")
                setSelectedStatus("")
              }}
            >
              リセット
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ユーザー一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>ユーザー</TableHead>
                  <TableHead>大学</TableHead>
                  <TableHead>学年</TableHead>
                  <TableHead>認証</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead className="w-12">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>
                            {user.fullName?.charAt(0) || user.nickname?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="space-y-1">
                            {(() => {
                              // デバッグ用: データの状態を確認
                              const hasFullName = user.fullName && user.fullName.trim() !== ""
                              const hasNickname = user.nickname && user.nickname.trim() !== ""
                              
                              if (hasFullName && hasNickname) {
                                // 両方設定されている場合
                                return (
                                  <>
                                    <div className="font-medium flex items-center gap-2">
                                      <span className="text-gray-900">{user.fullName}</span>
                                      <Badge variant="outline" className="text-xs">本名</Badge>
                                      {user.isOfficial && (
                                        <Shield className="h-3 w-3 text-blue-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">{user.nickname}</span>
                                      <Badge variant="secondary" className="text-xs">表示名</Badge>
                                    </div>
                                  </>
                                )
                              } else if (hasFullName) {
                                // 本名のみ設定されている場合
                                return (
                                  <div className="font-medium flex items-center gap-2">
                                    <span className="text-gray-900">{user.fullName}</span>
                                    <Badge variant="outline" className="text-xs">本名</Badge>
                                    {user.isOfficial && (
                                      <Shield className="h-3 w-3 text-blue-500" />
                                    )}
                                  </div>
                                )
                              } else if (hasNickname) {
                                // 表示名のみ設定されている場合
                                return (
                                  <div className="font-medium flex items-center gap-2">
                                    <span className="text-gray-900">{user.nickname}</span>
                                    <Badge variant="secondary" className="text-xs">表示名</Badge>
                                    {user.isOfficial && (
                                      <Shield className="h-3 w-3 text-blue-500" />
                                    )}
                                  </div>
                                )
                              } else {
                                // 両方とも設定されていない場合
                                return (
                                  <div className="font-medium flex items-center gap-2">
                                    <span className="text-gray-500">名前なし</span>
                                    {user.isOfficial && (
                                      <Shield className="h-3 w-3 text-blue-500" />
                                    )}
                                  </div>
                                )
                              }
                            })()}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>{user.university || "-"}</TableCell>
                    <TableCell>{user.grade || "-"}</TableCell>
                    
                    <TableCell>
                      {user.emailVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                    </TableCell>
                    
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, 'view')}
                          >
                            詳細を見る
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, 'email')}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            メール送信
                          </DropdownMenuItem>
                          
                          {/* ステータス変更メニュー */}
                          {user.status === 'active' ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'suspend')}
                                className="text-orange-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                アカウント停止
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'ban')}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                アカウント禁止
                              </DropdownMenuItem>
                            </>
                          ) : user.status === 'suspended' ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'activate')}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                停止解除
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'ban')}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                アカウント禁止
                              </DropdownMenuItem>
                            </>
                          ) : user.status === 'banned' ? (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              禁止解除
                            </DropdownMenuItem>
                          ) : (
                            // デフォルト（ステータス不明）
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              アクティブ化
                            </DropdownMenuItem>
                          )}
                          
                          {/* 公式バッジ管理 */}
                          {!user.isOfficial ? (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user.id, 'make_official')}
                              className="text-blue-600"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              公式バッジ付与
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user.id, 'remove_official')}
                              className="text-gray-600"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              公式バッジ削除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* ページネーション */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ユーザー詳細モーダル */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUserUpdated={fetchUsers}
      />
    </div>
  )
}