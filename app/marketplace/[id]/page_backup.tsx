"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, MessageCircle, User, BookOpen, Heart, CheckCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { OfficialIcon } from "@/app/components/official-badge"
import { ImageGallery } from "@/app/components/image-gallery"
import { getTextbookById, getUserNickname, getUserProfile, createOrGetConversation, Textbook, isFavorite, addToFavorites, removeFromFavorites, updateTextbookStatus } from "@/lib/firestore"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/lib/useAuth"

export default function TextbookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [textbook, setTextbook] = useState<Textbook | null>(null)
  const [loading, setLoading] = useState(true)
  const [favoriteStatus, setFavoriteStatus] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [sellerName, setSellerName] = useState("")
  const [sellerProfile, setSellerProfile] = useState<{name: string, avatarUrl?: string, isOfficial?: boolean, officialType?: string} | null>(null)

  const conditionMap: Record<string, string> = {
    new: "新品",
    like_new: "ほぼ新品",
    good: "良好",
    fair: "普通",
    poor: "傷あり",
  }

  useEffect(() => {
    const fetchData = async () => {
      const id = params.id as string
      const book = await getTextbookById(id)
      if (!book) {
        router.push("/marketplace")
        return
      }
      setTextbook(book)

      if (book.userId) {
        try {
          const profile = await getUserProfile(book.userId)
          setSellerProfile(profile)
          setSellerName(profile?.name || "不明")
        } catch (error) {
          console.error("出品者情報取得エラー:", error)
          setSellerName("不明")
          setSellerProfile(null)
        }
      }

      // お気に入り状態を確認
      if (user) {
        try {
          const favorite = await isFavorite(user.uid, book.id)
          setFavoriteStatus(favorite)
        } catch (error) {
          console.error("お気に入り状態取得エラー:", error)
        }
      }

      setLoading(false)
    }
    fetchData()
  }, [params.id, router, user])

  const handleFavoriteToggle = async () => {
    if (!user || !textbook) return

    setFavoriteLoading(true)
    try {
      if (favoriteStatus) {
        await removeFromFavorites(user.uid, textbook.id)
        setFavoriteStatus(false)
      } else {
        await addToFavorites(user.uid, textbook.id)
        setFavoriteStatus(true)
      }
    } catch (error) {
      console.error("お気に入り操作エラー:", error)
      alert("お気に入りの操作に失敗しました")
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'available' | 'sold') => {
    if (!user || !textbook || user.uid !== textbook.userId) return
    
    try {
      await updateTextbookStatus(textbook.id, newStatus)
      setTextbook(prev => prev ? { ...prev, status: newStatus } : null)
      alert(newStatus === 'sold' ? '成約済みに変更しました' : '出品中に戻しました')
    } catch (error) {
      console.error("ステータス変更エラー:", error)
      alert("ステータスの変更に失敗しました")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto py-10 px-4 flex-1 flex items-center justify-center">
          <p className="text-lg">読み込み中...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!textbook) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto py-10 px-4 flex-1 flex items-center justify-center">
          <p className="text-lg text-red-500">教科書が見つかりませんでした</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto py-6 px-4 flex-1">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="flex items-center gap-1" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4" />
              出品一覧に戻る
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <ImageGallery 
              images={textbook.imageUrls || (textbook.imageUrl ? [textbook.imageUrl] : [])}
              title={textbook.title}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                <span>出品日: {formatDate(textbook.createdAt)}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="mr-1 h-4 w-4" />
                <span>閲覧数: {textbook.views ?? 0}回</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="mb-2">
                  教科書
                </Badge>
                <div className="flex gap-2">
                  <Badge variant="secondary">{conditionMap[textbook.condition] || textbook.condition}</Badge>
                  {textbook.status === 'sold' && (
                    <Badge variant="destructive">売切済</Badge>
                  )}
                  {textbook.status === 'reserved' && (
                    <Badge variant="secondary">予約済</Badge>
                  )}
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{textbook.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">{textbook.author}</p>
              <div className="flex items-center gap-4 mt-4">
                <p className={`text-2xl font-bold ${textbook.status === 'sold' ? 'line-through text-muted-foreground' : ''}`}>
                  ¥{textbook.price?.toLocaleString?.()}
                </p>
                {textbook.status === 'sold' && (
                  <Badge variant="destructive">売切済</Badge>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="font-semibold text-lg mb-2">説明</h2>
              <p className="text-muted-foreground whitespace-pre-line">{textbook.description}</p>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-2">取引情報</h2>
              <div className="space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">希望取引場所</p>
                    <p className="text-muted-foreground">{textbook.meetupLocation || textbook.university || "キャンパス内"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">出品者</p>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">{sellerName || "不明"}</p>
                      <OfficialIcon 
                        isOfficial={sellerProfile?.isOfficial} 
                        officialType={sellerProfile?.officialType as 'admin' | 'support' | 'team'} 
                        className="scale-75"
                      />
                    </div>
                    {textbook.university && (
                      <p className="text-xs text-muted-foreground">{textbook.university}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 連絡・お気に入りボタン */}
            <div className="space-y-4 pt-4">
              {/* ステータス表示 */}
              {user && user.uid !== textbook?.userId && (
                <>
                  {textbook?.status === 'sold' ? (
                    <div className="w-full p-4 bg-muted rounded-lg text-center">
                      <Badge variant="destructive" className="mb-2">売切済</Badge>
                      <p className="text-sm text-muted-foreground">この教科書はすでに販売終了しています</p>
                    </div>
                  ) : textbook?.status === 'reserved' ? (
                    <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <Badge variant="secondary" className="mb-2">予約済</Badge>
                      <p className="text-sm text-muted-foreground">この教科書は予約済みです</p>
                    </div>
                  ) : (
                    <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <Badge variant="secondary" className="mb-2 bg-green-100 text-green-800">購入可能</Badge>
                      <p className="text-sm text-muted-foreground">出品者に連絡して取引を開始しましょう</p>
                    </div>
                  )}
                </>
              )}

              {/* 出品者向けステータス変更ボタン */}
              {user && user.uid === textbook?.userId && (
                <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-3">出品者メニュー</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {textbook?.status === 'sold' ? (
                      <Button
                        variant="outline"
                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleStatusChange('available')}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        出品中に戻す
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleStatusChange('sold')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        成約済みにする
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* 連絡・お気に入りボタン */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={textbook?.status === 'sold'}
                  onClick={async () => {
                    try {
                      console.log("連絡ボタンクリック - ユーザー:", user?.uid)
                      console.log("連絡ボタンクリック - 出品者:", textbook?.userId)
                      
                      if (!user || !textbook?.userId) {
                        console.log("ユーザーまたは出品者情報がありません")
                        router.push("/login")
                        return
                      }

                      if (user.uid === textbook.userId) {
                        alert("自分の出品には連絡できません")
                        return
                      }

                      console.log("会話作成開始...")
                      const conversationId = await createOrGetConversation(
                        user.uid,
                        textbook.userId,
                        textbook.id
                      )
                      console.log("作成された会話ID:", conversationId)

                      router.push(`/messages/${conversationId}`)
                    } catch (error) {
                      console.error("会話作成エラー:", error)
                      const errorMessage = error instanceof Error ? error.message : String(error)
                      alert(`エラーが発生しました: ${errorMessage}`)
                    }
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {textbook?.status === 'sold' ? '売切済' : '出品者に連絡する'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading || !user}
                >
                  <Heart className={`mr-2 h-4 w-4 ${favoriteStatus ? "fill-current text-red-500" : ""}`} />
                  {favoriteLoading ? "処理中..." : favoriteStatus ? "お気に入り済み" : "お気に入りに追加"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}