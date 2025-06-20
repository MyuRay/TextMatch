"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/lib/useAuth"
import { Textbook, UserProfile, getUserFavorites, getUserPurchases, getUserSellingBooks, createOrGetConversation, removeFromFavorites } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/avatar"
import {
  BookOpen, Edit, Heart, MessageSquare, Package, Settings, ShoppingBag, Trash2
} from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [sellingBooks, setSellingBooks] = useState<Textbook[]>([])
  const [favorites, setFavorites] = useState<Textbook[]>([])
  const [purchases, setPurchases] = useState<Textbook[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        router.push("/login")
        return
      }
      
      try {
        console.log("マイページ：ユーザーデータ取得開始", user.uid)
        
        // ユーザープロフィール取得
        try {
          console.log("Step 1: ユーザープロフィール取得中...")
          const userDoc = await getDoc(doc(db, "users", user.uid))
          console.log("ユーザードキュメント存在:", userDoc.exists())
          setUserData(userDoc.exists() ? userDoc.data() as UserProfile : null)
          console.log("Step 1: ユーザープロフィール取得完了")
        } catch (profileError) {
          console.error("Step 1 エラー:", profileError)
          throw profileError
        }

        // 出品中の教科書取得
        try {
          console.log("Step 2: 出品中の教科書取得中...")
          const userSellingBooks = await getUserSellingBooks(user.uid)
          console.log("マイページ：取得した出品中教科書:", userSellingBooks)
          setSellingBooks(userSellingBooks)
          console.log("Step 2: 出品中の教科書取得完了")
        } catch (sellingError) {
          console.error("Step 2 エラー:", sellingError)
          console.log("出品中の教科書取得をスキップ（エラーのため）")
          setSellingBooks([])
        }

        // お気に入り取得
        try {
          console.log("Step 3: お気に入り取得中...")
          const userFavorites = await getUserFavorites(user.uid)
          console.log("マイページ：取得したお気に入り件数:", userFavorites.length)
          console.log("マイページ：取得したお気に入り詳細:", userFavorites)
          setFavorites(userFavorites)
          console.log("Step 3: お気に入り取得完了")
        } catch (favoritesError) {
          console.error("Step 3 エラー:", favoritesError)
          console.log("お気に入り取得をスキップ（エラーのため）")
          setFavorites([])
        }

        // 購入履歴取得
        try {
          console.log("Step 4: 購入履歴取得中...")
          const userPurchases = await getUserPurchases(user.uid)
          console.log("マイページ：取得した購入履歴:", userPurchases)
          setPurchases(userPurchases)
          console.log("Step 4: 購入履歴取得完了")
        } catch (purchasesError) {
          console.error("Step 4 エラー:", purchasesError)
          console.log("購入履歴取得をスキップ（エラーのため）")
          setPurchases([])
        }
        
        console.log("マイページ：全データ取得完了")
      } catch (error) {
        console.error("ユーザーデータ取得エラー:", error)
        console.error("エラーの型:", typeof error)
        console.error("エラーの構造:", Object.keys(error || {}))
        console.error("エラー文字列:", String(error))
        
        // Firebaseエラーの詳細を取得
        if (error && typeof error === 'object') {
          console.error("Firebase エラーコード:", (error as any).code)
          console.error("Firebase エラーメッセージ:", (error as any).message)
          console.error("Firebase エラー詳細:", JSON.stringify(error, null, 2))
        }
        
        console.error("ユーザーUID:", user.uid)
      } finally {
        setDataLoading(false)
      }
    }
    
    if (!loading) {
      fetchUserData()
    }
  }, [user, loading, router])

  // お気に入りタブ切り替え時にデータを更新
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab)
    
    if (tab === "favorites" && user) {
      setFavoritesLoading(true)
      try {
        console.log("お気に入りタブ：データ更新開始")
        const userFavorites = await getUserFavorites(user.uid)
        console.log("お気に入りタブ：取得したお気に入り:", userFavorites)
        setFavorites(userFavorites)
      } catch (error) {
        console.error("お気に入りタブ：データ取得エラー:", error)
      } finally {
        setFavoritesLoading(false)
      }
    }
  }

  if (loading || dataLoading) return <div className="p-8 text-center">読み込み中...</div>
  if (!user) return <div className="p-8 text-center text-red-500">ログインが必要です</div>
  if (!userData) return <div className="p-8 text-center text-red-500">ユーザー情報が取得できませんでした</div>

  const avatarFallback = userData.fullName?.substring(0, 2) ?? "U"

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">マイページ</h1>
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <div className="w-full md:w-60">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatarUrl || "/placeholder.svg"} alt={userData.fullName} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold">{userData.fullName}</h2>
                    <p className="text-sm text-muted-foreground">{userData.university}</p>
                    <p className="text-sm text-muted-foreground">{userData.department}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <TabButton label="プロフィール" icon={<Settings />} active={activeTab === "profile"} onClick={() => handleTabChange("profile")} />
                  <TabButton label="出品中の教科書" icon={<BookOpen />} active={activeTab === "selling"} onClick={() => handleTabChange("selling")} />
                  <TabButton label="購入履歴" icon={<ShoppingBag />} active={activeTab === "purchased"} onClick={() => handleTabChange("purchased")} />
                  <TabButton label="お気に入り" icon={<Heart />} active={activeTab === "favorites"} onClick={() => handleTabChange("favorites")} />
                  <TabButton label="メッセージ" icon={<MessageSquare />} active={activeTab === "messages"} onClick={() => handleTabChange("messages")} />
                </div>
                <div className="mt-6">
                  <Link href="/post-textbook">
                    <Button className="w-full">
                      <BookOpen className="mr-2 h-4 w-4" />教科書を出品する
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {activeTab === "profile" && <ProfileCard user={userData} />}
            {activeTab === "selling" && <BooksListCard title="出品中の教科書" books={sellingBooks} isEditable />} 
            {activeTab === "purchased" && <BooksListCard title="購入履歴" books={purchases} isPurchase />} 
            {activeTab === "favorites" && (
              favoritesLoading ? (
                <Card>
                  <CardHeader><CardTitle>お気に入り</CardTitle></CardHeader>
                  <CardContent className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">お気に入りを読み込み中...</p>
                  </CardContent>
                </Card>
              ) : (
                <BooksListCard 
                  title="お気に入り" 
                  books={favorites} 
                  favorites={favorites} 
                  setFavorites={setFavorites} 
                />
              )
            )} 
            {activeTab === "messages" && (
              <Card>
                <CardHeader><CardTitle>メッセージ</CardTitle></CardHeader>
                <CardContent>
                  <Link href="/messages"><Button className="w-full">メッセージ一覧へ</Button></Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function TabButton({ label, icon, active, onClick }: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <Button variant={active ? "default" : "ghost"} className="w-full justify-start" onClick={onClick}>
      <span className="mr-2">{icon}</span>{label}
    </Button>
  )
}

function ProfileCard({ user }: { user: UserProfile }) {
  return (
    <Card>
      <CardHeader><CardTitle>プロフィール</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p><strong>名前：</strong>{user.fullName}</p>
        <p><strong>メール：</strong>{user.email}</p>
        <p><strong>学籍番号：</strong>{user.studentId}</p>
        <p><strong>大学：</strong>{user.university}</p>
        <p><strong>学部：</strong>{user.department || "未設定"}</p>
        <p><strong>登録日：</strong>{user.createdAt?.toDate?.()?.toLocaleDateString() || "不明"}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline"><Edit className="mr-2 h-4 w-4" />プロフィールを編集</Button>
      </CardFooter>
    </Card>
  )
}

function BooksListCard({ title, books, isPurchase = false, isEditable = false, favorites, setFavorites }: {
  title: string
  books: Textbook[]
  isPurchase?: boolean
  isEditable?: boolean
  favorites?: Textbook[]
  setFavorites?: (favorites: Textbook[]) => void
}) {
  const isFavorites = title === "お気に入り"
  const { user } = useAuth()
  const router = useRouter()
  
  const handleMessageSeller = async (book: Textbook) => {
    if (!user || !book.userId) {
      router.push("/login")
      return
    }

    if (user.uid === book.userId) {
      alert("自分の出品には連絡できません")
      return
    }

    try {
      console.log("出品者に連絡 - ユーザー:", user.uid)
      console.log("出品者に連絡 - 出品者:", book.userId)
      
      const conversationId = await createOrGetConversation(
        user.uid,
        book.userId,
        book.id
      )
      console.log("作成された会話ID:", conversationId)

      router.push(`/messages/${conversationId}`)
    } catch (error) {
      console.error("会話作成エラー:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`エラーが発生しました: ${errorMessage}`)
    }
  }

  const handleRemoveFromFavorites = async (book: Textbook) => {
    if (!user || !favorites || !setFavorites) return

    try {
      console.log("お気に入りから削除:", book.id)
      await removeFromFavorites(user.uid, book.id)
      
      // お気に入り一覧を更新
      const updatedFavorites = favorites.filter(fav => fav.id !== book.id)
      setFavorites(updatedFavorites)
      
      console.log("お気に入りから削除完了")
    } catch (error) {
      console.error("お気に入り削除エラー:", error)
      alert("お気に入りの削除に失敗しました")
    }
  }

  const formatPurchaseDate = (purchasedAt: any) => {
    if (!purchasedAt) return "不明"
    
    try {
      // Timestamp オブジェクトの場合
      if (purchasedAt.toDate) {
        return purchasedAt.toDate().toLocaleDateString('ja-JP')
      }
      // 秒数の場合
      if (purchasedAt.seconds) {
        return new Date(purchasedAt.seconds * 1000).toLocaleDateString('ja-JP')
      }
      // Date オブジェクトの場合
      if (purchasedAt instanceof Date) {
        return purchasedAt.toLocaleDateString('ja-JP')
      }
      return String(purchasedAt)
    } catch (error) {
      console.error("日付変換エラー:", error)
      return "不明"
    }
  }
  
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {books.length === 0 ? (
          <div className="text-center py-8">
            {isFavorites ? (
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            ) : isPurchase ? (
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            ) : isEditable ? (
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-muted-foreground">
              {isFavorites 
                ? "お気に入りの教科書はまだありません" 
                : isPurchase 
                ? "購入した教科書はまだありません"
                : isEditable 
                ? "出品中の教科書はありません"
                : "該当する教科書はありません"}
            </p>
            {isFavorites && (
              <Link href="/marketplace">
                <Button variant="outline" className="mt-4">
                  <BookOpen className="mr-2 h-4 w-4" />
                  教科書を探す
                </Button>
              </Link>
            )}
            {isEditable && (
              <Link href="/post-textbook">
                <Button variant="outline" className="mt-4">
                  <BookOpen className="mr-2 h-4 w-4" />
                  教科書を出品する
                </Button>
              </Link>
            )}
          </div>
        ) : books.map((book: any) => (
          <Card key={book.id} className="p-4">
            <div className="flex gap-4">
              <img src={book.imageUrl || "/placeholder.svg"} alt={book.title} className="w-20 h-28 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <p className="text-sm">価格：¥{book.price?.toLocaleString()}</p>
                {book.status === 'sold' && <p className="text-sm text-red-500">売切済</p>}
                {book.status === 'reserved' && <p className="text-sm text-yellow-500">予約済</p>}
                {book.status === 'available' && isEditable && <p className="text-sm text-green-500">出品中</p>}
                {isPurchase && <p className="text-sm">購入日：{formatPurchaseDate(book.purchasedAt)}</p>}
                <div className="mt-2 flex gap-2">
                  {isFavorites && (
                    <>
                      <Link href={`/marketplace/${book.id}`}>
                        <Button variant="outline" size="sm">
                          <BookOpen className="mr-2 h-4 w-4" /> 詳細を見る
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveFromFavorites(book)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> 削除
                      </Button>
                    </>
                  )}
                  {isPurchase && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMessageSeller(book)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> 出品者に連絡
                    </Button>
                  )}
                  {isEditable && (
                    <>
                      <Link href={`/marketplace/${book.id}`}>
                        <Button variant="outline" size="sm">
                          <BookOpen className="mr-2 h-4 w-4" /> 詳細を見る
                        </Button>
                      </Link>
                      <Link href={`/edit/${book.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" /> 編集する
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}