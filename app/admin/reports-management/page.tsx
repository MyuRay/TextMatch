"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/useAuth"
import { isAdmin } from "@/lib/adminUtils"
import { getReports, updateReportStatus } from "@/lib/adminFirestore"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ChevronLeft, 
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  BookOpen,
  User
} from "lucide-react"

interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  conversationId?: string
  textbookId?: string
  reason: string
  details?: string
  reporterName: string
  reportedUserName: string
  textbookTitle?: string
  createdAt: any
  status: 'pending' | 'reviewed' | 'resolved'
  reviewed: boolean
  adminNotes?: string
  resolvedAt?: any
  resolvedBy?: string
}

const reasonMap: Record<string, string> = {
  no_show: "約束の日時に現れず、連絡が取れない",
  fraud: "詐欺的行為（偽の商品情報、代金持ち逃げ等）",
  harassment: "嫌がらせ・迷惑行為",
  external_contact: "外部SNS・プラットフォームへの誘導",
  inappropriate_language: "不適切な言葉遣い・暴言",
  fake_profile: "なりすまし・偽プロフィール",
  payment_issue: "決済関連のトラブル",
  violation: "利用規約違反",
  other: "その他"
}

export default function ReportsManagementPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [allReports, setAllReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

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
    const loadReports = async () => {
      if (!user || !isAdmin(userProfile)) return
      
      try {
        setIsLoading(true)
        // すべての通報を取得（ステータスフィルタしない）
        const { reports: reportsList } = await getReports(100, undefined)
        setAllReports(reportsList)
      } catch (error) {
        console.error("通報一覧読み込みエラー:", error)
        alert("通報一覧の読み込みに失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [user, userProfile]) // activeTabを依存配列から削除

  const handleUpdateStatus = async (reportId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    if (!user) return
    
    setUpdating(true)
    try {
      await updateReportStatus(reportId, status, adminNotes || undefined, user.uid)
      
      // ローカル状態を更新
      setAllReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, reviewed: true, adminNotes: adminNotes || undefined }
          : report
      ))
      
      setSelectedReport(null)
      setAdminNotes('')
      alert(`通報を${status === 'resolved' ? '解決済み' : status === 'reviewed' ? '確認済み' : '保留中'}に更新しました`)
    } catch (error) {
      console.error("通報状態更新エラー:", error)
      alert("通報状態の更新に失敗しました")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">未対応</Badge>
      case 'reviewed':
        return <Badge variant="secondary">確認済み</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">解決済み</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '未設定'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('ja-JP')
  }

  // アクティブなタブに基づいて通報をフィルタリング
  const filteredReports = allReports.filter(report => {
    if (activeTab === 'all') return true
    return report.status === activeTab
  })

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
                    <Flag className="h-6 w-6" />
                    通報管理
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    ユーザーからの通報を確認・対応
                  </p>
                </div>
              </div>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">総通報数</p>
                      <p className="text-2xl font-bold">{allReports.length}</p>
                    </div>
                    <Flag className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">未対応</p>
                      <p className="text-2xl font-bold text-red-600">
                        {allReports.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">確認済み</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {allReports.filter(r => r.status === 'reviewed').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">解決済み</p>
                      <p className="text-2xl font-bold text-green-600">
                        {allReports.filter(r => r.status === 'resolved').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* タブ */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="pending">未対応</TabsTrigger>
                <TabsTrigger value="reviewed">確認済み</TabsTrigger>
                <TabsTrigger value="resolved">解決済み</TabsTrigger>
                <TabsTrigger value="all">すべて</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>通報一覧</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredReports.length === 0 ? (
                      <div className="text-center py-8">
                        <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">通報がありません</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredReports.map((report) => (
                          <div key={report.id} className="p-4 hover:bg-muted/50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusBadge(report.status)}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(report.createdAt)}
                                  </span>
                                </div>
                                
                                <h3 className="font-semibold text-base mb-1">
                                  {reasonMap[report.reason] || report.reason}
                                </h3>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span>👤 通報者: {report.reporterName}</span>
                                  <span>⚠️ 被通報者: {report.reportedUserName}</span>
                                </div>

                                {report.textbookTitle && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                    <BookOpen className="h-3 w-3" />
                                    <span>{report.textbookTitle}</span>
                                  </div>
                                )}

                                {report.details && (
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                                    {report.details}
                                  </p>
                                )}

                                {report.adminNotes && (
                                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                                    <strong>管理者メモ:</strong> {report.adminNotes}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-2 ml-4">
                                {report.conversationId && (
                                  <Button size="sm" variant="outline" asChild>
                                    <Link href={`/messages/${report.conversationId}`}>
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      会話
                                    </Link>
                                  </Button>
                                )}
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="secondary"
                                      onClick={() => {
                                        setSelectedReport(report)
                                        setAdminNotes(report.adminNotes || '')
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      対応
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>通報対応</DialogTitle>
                                      <DialogDescription>
                                        通報内容を確認し、適切な対応を選択してください
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {selectedReport && (
                                      <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <h4 className="font-medium mb-2">通報詳細</h4>
                                          <p><strong>理由:</strong> {reasonMap[selectedReport.reason] || selectedReport.reason}</p>
                                          <p><strong>通報者:</strong> {selectedReport.reporterName}</p>
                                          <p><strong>被通報者:</strong> {selectedReport.reportedUserName}</p>
                                          {selectedReport.textbookTitle && (
                                            <p><strong>教科書:</strong> {selectedReport.textbookTitle}</p>
                                          )}
                                          {selectedReport.details && (
                                            <p><strong>詳細:</strong> {selectedReport.details}</p>
                                          )}
                                        </div>

                                        <div>
                                          <label className="text-sm font-medium mb-2 block">管理者メモ</label>
                                          <Textarea
                                            placeholder="対応内容や確認事項を記録..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            className="min-h-[80px]"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    <DialogFooter>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="outline"
                                          onClick={() => selectedReport && handleUpdateStatus(selectedReport.id, 'reviewed')}
                                          disabled={updating}
                                        >
                                          確認済みにする
                                        </Button>
                                        <Button 
                                          onClick={() => selectedReport && handleUpdateStatus(selectedReport.id, 'resolved')}
                                          disabled={updating}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          {updating ? "更新中..." : "解決済みにする"}
                                        </Button>
                                      </div>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        ))}
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