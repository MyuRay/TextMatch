"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/lib/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, MapPin, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { getTextbookById, Textbook } from "@/lib/firestore"

interface Favorite {
  id: string
  userId: string
  textbookId: string
  createdAt: any
  textbook?: Textbook
}

export default function FavoritesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchFavorites()
    }
  }, [user, loading, router])

  const fetchFavorites = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log("お気に入り一覧の取得を開始します。ユーザーID:", user.uid)

      // ユーザーのお気に入りを取得
      const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", user.uid)
      )
      const favoritesSnapshot = await getDocs(favoritesQuery)
      console.log("お気に入り数:", favoritesSnapshot.size)

      // 各お気に入りに対応する教科書の詳細情報を取得
      const favoritesWithDetails = await Promise.all(
        favoritesSnapshot.docs.map(async (doc) => {
          try {
            const favoriteData = doc.data()
            console.log("お気に入りデータ:", favoriteData)
            
            // 教科書情報を取得
            const textbook = await getTextbookById(favoriteData.textbookId)
            console.log("教科書情報:", textbook)

            const favorite: Favorite = {
              id: doc.id,
              userId: favoriteData.userId,
              textbookId: favoriteData.textbookId,
              textbook: textbook || undefined,
              createdAt: favoriteData.createdAt?.toDate() || new Date()
            }
            return favorite
          } catch (error) {
            console.error("お気に入り詳細取得エラー:", error)
            return null
          }
        })
      )

      // nullの要素を除去し、作成日時でソート（新しい順）
      const validFavorites = favoritesWithDetails
        .filter(fav => fav !== null && fav.textbook !== undefined)
        .sort((a, b) => {
          const aTime = a?.createdAt?.getTime() || 0
          const bTime = b?.createdAt?.getTime() || 0
          return bTime - aTime
        }) as Favorite[]

      console.log("最終的なお気に入り一覧:", validFavorites)
      setFavorites(validFavorites)
    } catch (error) {
      console.error("お気に入り一覧取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case '新品同様':
        return 'bg-green-100 text-green-800'
      case '良好':
        return 'bg-blue-100 text-blue-800'
      case '使用感あり':
        return 'bg-yellow-100 text-yellow-800'
      case '破損あり':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto py-10 px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">お気に入り</h1>
            <Badge variant="secondary" className="ml-2">
              {favorites.length}件
            </Badge>
          </div>

          {favorites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">お気に入りがありません</h3>
                <p className="text-muted-foreground mb-6">
                  気になる教科書をお気に入りに追加して、<br />
                  あとで簡単にアクセスできるようにしましょう。
                </p>
                <Button asChild>
                  <Link href="/marketplace">教科書を探す</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/marketplace/${favorite.textbook?.id}`}>
                    <div className="aspect-[4/3] relative bg-gray-100">
                      {favorite.textbook?.imageUrl ? (
                        <Image
                          src={favorite.textbook.imageUrl}
                          alt={favorite.textbook.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                            {favorite.textbook?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {favorite.textbook?.author}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            ¥{favorite.textbook?.price.toLocaleString()}
                          </span>
                          <Badge className={getConditionColor(favorite.textbook?.condition || '')}>
                            {favorite.textbook?.condition}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{favorite.textbook?.university}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>お気に入り登録: {formatDate(favorite.createdAt)}</span>
                        </div>

                        {favorite.textbook?.status === 'sold' && (
                          <div className="flex items-center justify-center py-2">
                            <Badge variant="secondary" className="text-center">
                              売り切れ
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}