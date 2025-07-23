"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, MessageCircle, User, BookOpen, Heart, CheckCircle, RotateCcw, CreditCard, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { OfficialIcon } from "@/app/components/official-badge"
import { ImageGallery } from "@/app/components/image-gallery"
import { getTextbookById, getUserNickname, getUserProfile, createOrGetConversation, Textbook, isFavorite, addToFavorites, removeFromFavorites, updateTextbookStatus, incrementTextbookViews } from "@/lib/firestore"
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
  const [otherBooks, setOtherBooks] = useState<Textbook[]>([])
  const [otherBooksLoading, setOtherBooksLoading] = useState(false)

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

      // 閲覧数を更新（自分の投稿は除外）
      if (user) {
        await incrementTextbookViews(id, user.uid)
      } else {
        await incrementTextbookViews(id)
      }

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

      // 出品者の他の投稿を取得
      if (book.userId) {
        await fetchOtherBooks(book.userId, book.id)
      }

      setLoading(false)
    }
    fetchData()
  }, [params.id, router, user])

  const fetchOtherBooks = async (sellerId: string, currentBookId: string) => {
    setOtherBooksLoading(true)
    try {
      const { collection, query, where, getDocs, limit } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebaseConfig")
      
      // 同じ出品者の他の投稿を取得（orderByを削除してインデックス不要に）
      const q = query(
        collection(db, "books"),
        where("userId", "==", sellerId),
        limit(10) // 多めに取得してフィルタリング
      )
      
      const snapshot = await getDocs(q)
      const books = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Textbook))
        .filter(book => 
          book.id !== currentBookId && // 現在の投稿を除外
          (book.status === 'available' || book.status === undefined || book.status === null) // 販売中のみ
        )
        .sort((a, b) => {
          // クライアント側でソート（新しい順）
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
        .slice(0, 4) // 最大4件に制限
      
      setOtherBooks(books)
    } catch (error) {
      console.error("他の投稿取得エラー:", error)
    } finally {
      setOtherBooksLoading(false)
    }
  }

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
                  {(textbook.status === 'sold' || textbook.transactionStatus === 'paid') && (
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
                <p className={`text-2xl font-bold ${(textbook.status === 'sold' || textbook.transactionStatus === 'paid') ? 'line-through text-muted-foreground' : ''}`}>
                  ¥{textbook.price?.toLocaleString?.()}
                </p>
                {(textbook.status === 'sold' || textbook.transactionStatus === 'paid') && (
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
                    <Link href={`/seller/${textbook.userId}`} className="group">
                      <div className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded transition-colors">
                        <p className="text-muted-foreground group-hover:text-primary transition-colors">
                          {sellerName || "不明"}
                        </p>
                        <OfficialIcon 
                          isOfficial={sellerProfile?.isOfficial} 
                          officialType={sellerProfile?.officialType as 'admin' | 'support' | 'team'} 
                          className="scale-75"
                        />
                      </div>
                    </Link>
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
                  {(textbook?.status === 'sold' || textbook?.transactionStatus === 'paid') ? (
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
                      <p className="text-xs text-muted-foreground mt-2">※ 出品者との相談後、販売許可が出た場合に購入ボタンが表示されます</p>
                    </div>
                  )}
                </>
              )}

              {/* 出品者向けステータス変更ボタン */}
              {user && user.uid === textbook?.userId && (
                <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-3">出品者メニュー</p>
                  <div className="space-y-2">
                    {/* 商品編集ボタン */}
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      asChild
                    >
                      <Link href={`/edit/${textbook?.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        商品情報を編集
                      </Link>
                    </Button>
                    
                    {/* ステータス変更ボタン */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {(textbook?.status === 'sold' || textbook?.transactionStatus === 'paid') ? (
                        textbook?.transactionStatus === 'paid' || textbook?.transactionStatus === 'completed' ? (
                          <Button
                            variant="secondary"
                            className="flex-1 bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
                            disabled={true}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            決済完了済み
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange('available')}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            出品中に戻す
                          </Button>
                        )
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
                </div>
              )}
              
              {/* 連絡・お気に入りボタン */}
              <div className="flex flex-col gap-4">
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={(textbook?.status === 'sold' || textbook?.transactionStatus === 'paid')}
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
                    {(textbook?.status === 'sold' || textbook?.transactionStatus === 'paid') ? '売切済' : '出品者に連絡する'}
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
        </div>
      </main>

      {/* 同じ出品者の他の投稿 */}
      {otherBooks.length > 0 && (
        <section className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">同じ出品者の他の投稿</h2>
                {sellerProfile && (
                  <Link href={`/seller/${textbook?.userId}`} className="text-primary hover:underline text-sm">
                    {sellerProfile.name}さんの出品一覧を見る →
                  </Link>
                )}
              </div>
            </div>
            
            {otherBooksLoading ? (
              <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-4 pb-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-lg aspect-[4/3] flex-shrink-0 w-[180px] md:w-auto"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden md:overflow-visible">
                <div className="flex gap-4 md:grid md:grid-cols-4 pb-4 animate-scroll-x md:animate-none">
                  {/* 元のコンテンツ */}
                  {otherBooks.map((book) => (
                    <Link key={book.id} href={`/marketplace/${book.id}`} className="block flex-shrink-0 w-[180px] md:w-auto">
                      <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                          <img
                            src={(book.imageUrls && book.imageUrls[0]) || book.imageUrl || "/placeholder.svg"}
                            alt={book.title}
                            className="w-full h-full object-contain"
                          />
                          {/* 複数画像インジケータ */}
                          {book.imageUrls && book.imageUrls.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              +{book.imageUrls.length - 1}
                            </div>
                          )}
                          {/* 閲覧数 */}
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <span>👁</span>
                            {book.views || 0}
                          </div>
                          {/* 取引状態バッジ */}
                          {(book.status === 'sold' || book.transactionStatus === 'paid') && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                                売切
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-2">{book.title}</h3>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-primary">
                              ¥{book.price?.toLocaleString()}
                            </p>
                            <span className="text-xs text-gray-500">
                              {conditionMap[book.condition] || book.condition}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {/* 複製されたコンテンツ（無限スクロール用） */}
                  <div className="flex gap-4 md:hidden">
                    {otherBooks.map((book) => (
                      <Link key={`duplicate-${book.id}`} href={`/marketplace/${book.id}`} className="block flex-shrink-0 w-[180px]">
                        <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                            <img
                              src={(book.imageUrls && book.imageUrls[0]) || book.imageUrl || "/placeholder.svg"}
                              alt={book.title}
                              className="w-full h-full object-contain"
                            />
                            {/* 複数画像インジケータ */}
                            {book.imageUrls && book.imageUrls.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                +{book.imageUrls.length - 1}
                              </div>
                            )}
                            {/* 閲覧数 */}
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <span>👁</span>
                              {book.views || 0}
                            </div>
                            {/* 取引状態バッジ */}
                            {(book.status === 'sold' || book.transactionStatus === 'paid') && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                                  売切
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-sm line-clamp-2 mb-2">{book.title}</h3>
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-primary">
                                ¥{book.price?.toLocaleString()}
                              </p>
                              <span className="text-xs text-gray-500">
                                {conditionMap[book.condition] || book.condition}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  )
}