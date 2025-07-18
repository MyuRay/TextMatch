"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { getUserProfile, Textbook } from "@/lib/firestore"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, BookOpen, Package, Calendar, MapPin, Eye } from "lucide-react"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { OfficialIcon } from "@/app/components/official-badge"

interface SellerProfile {
  name: string
  email?: string
  university?: string
  avatarUrl?: string
  isOfficial?: boolean
  officialType?: 'admin' | 'support' | 'team'
  grade?: string
  createdAt?: any
}

export default function SellerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = params.id as string

  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [sellingBooks, setSellingBooks] = useState<Textbook[]>([])
  const [soldBooks, setSoldBooks] = useState<Textbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true)
        
        // 出品者のプロフィール情報を取得
        const profile = await getUserProfile(sellerId)
        if (!profile) {
          setError("出品者が見つかりませんでした")
          return
        }
        setSellerProfile({
          ...profile,
          officialType: profile.officialType as 'admin' | 'support' | 'team' | undefined
        })

        // 販売中の商品を取得
        const sellingQuery = query(
          collection(db, "books"),
          where("userId", "==", sellerId)
        )
        const sellingSnapshot = await getDocs(sellingQuery)
        const allBooks = sellingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Textbook[]
        
        console.log("出品者の全商品:", allBooks)
        
        // 販売中の商品をフィルタリング（status が 'available' または undefined）
        const sellingData = allBooks.filter(book => 
          book.status === 'available' || book.status === undefined || book.status === null
        )
        
        console.log("販売中の商品:", sellingData)
        
        // 作成日順にソート（新しい順）
        const sortedSelling = sellingData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
        setSellingBooks(sortedSelling)

        // 売却済みの商品を取得
        const soldQuery = query(
          collection(db, "books"),
          where("userId", "==", sellerId),
          where("status", "==", "sold"),
          where("transactionStatus", "==", "completed")
        )
        const soldSnapshot = await getDocs(soldQuery)
        const soldData = soldSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Textbook[]
        
        // 売却日順にソート（新しい順）
        const sortedSold = soldData.sort((a, b) => {
          const aTime = a.completedAt?.seconds || a.createdAt?.seconds || 0
          const bTime = b.completedAt?.seconds || b.createdAt?.seconds || 0
          return bTime - aTime
        })
        setSoldBooks(sortedSold)

      } catch (err) {
        console.error("出品者データ取得エラー:", err)
        setError("出品者情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    if (sellerId) {
      fetchSellerData()
    }
  }, [sellerId])

  const conditionMap: Record<string, string> = {
    new: "新品",
    like_new: "ほぼ新品",
    good: "良好",
    fair: "普通",
    poor: "傷あり",
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto py-10 px-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">読み込み中...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !sellerProfile) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto py-10 px-4 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-500">{error || "出品者が見つかりませんでした"}</p>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </div>
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
          <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </div>

        {/* 出品者プロフィール */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={sellerProfile.avatarUrl} alt={sellerProfile.name || "出品者"} />
                <AvatarFallback>
                  {sellerProfile.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">
                    {sellerProfile.name || "出品者"}
                  </h1>
                  <OfficialIcon 
                    isOfficial={sellerProfile.isOfficial} 
                    officialType={sellerProfile.officialType} 
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {sellerProfile.university && sellerProfile.university.trim() !== '' && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{sellerProfile.university}</span>
                    </div>
                  )}
                  {sellerProfile.grade && sellerProfile.grade.trim() !== '' && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{sellerProfile.grade}</span>
                    </div>
                  )}
                  {sellerProfile.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>登録日: {formatDate(sellerProfile.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 商品一覧タブ */}
        <Tabs defaultValue="selling" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selling" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              販売中 ({sellingBooks.length})
            </TabsTrigger>
            <TabsTrigger value="sold" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              売却済み ({soldBooks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="selling" className="space-y-4">
            {sellingBooks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">販売中の商品はありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {sellingBooks.map((book) => (
                  <Card key={book.id} className="overflow-hidden transition-all hover:shadow-md">
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
                        <Eye className="h-3 w-3" />
                        {book.views || 0}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* タイトル */}
                        <h3 className="font-semibold line-clamp-2 h-12">{book.title}</h3>

                        {/* 著者と大学名 */}
                        <div className="text-sm text-muted-foreground space-y-1">
                          {book.author && <p>{book.author}</p>}
                          {book.university && <p>{book.university}</p>}
                        </div>

                        {/* 価格 */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-medium text-lg">
                            ¥{book.price?.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {conditionMap[book.condition] || book.condition}
                          </Badge>
                        </div>

                        {/* 詳細ボタン */}
                        <Button 
                          className="w-full mt-2" 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <Link href={`/marketplace/${book.id}`}>
                            詳細を見る
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sold" className="space-y-4">
            {soldBooks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">売却済みの商品はありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {soldBooks.map((book) => (
                  <Card key={book.id} className="overflow-hidden transition-all hover:shadow-md opacity-75">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={(book.imageUrls && book.imageUrls[0]) || book.imageUrl || "/placeholder.svg"}
                        alt={book.title}
                        className="w-full h-full object-contain grayscale"
                      />
                      {/* 複数画像インジケータ */}
                      {book.imageUrls && book.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          +{book.imageUrls.length - 1}
                        </div>
                      )}
                      {/* 売却済みバッジ */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="shadow-md">
                          売切済
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* タイトル */}
                        <h3 className="font-semibold line-clamp-2 h-12">{book.title}</h3>

                        {/* 著者と大学名 */}
                        <div className="text-sm text-muted-foreground space-y-1">
                          {book.author && <p>{book.author}</p>}
                          {book.university && <p>{book.university}</p>}
                        </div>

                        {/* 価格 */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-medium text-lg line-through text-muted-foreground">
                            ¥{book.price?.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {conditionMap[book.condition] || book.condition}
                          </Badge>
                        </div>

                        {/* 売却日 */}
                        <div className="text-xs text-muted-foreground">
                          売却日: {formatDate(book.completedAt || book.createdAt)}
                        </div>

                        {/* 詳細ボタン */}
                        <Button 
                          className="w-full mt-2" 
                          variant="secondary" 
                          size="sm" 
                          disabled
                        >
                          売却済み
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}