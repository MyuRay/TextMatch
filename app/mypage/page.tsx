"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { collection, doc, getDoc, getDocs, query, where, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/lib/useAuth"
import { Textbook, UserProfile, getUserFavorites, getUserPurchases, getUserSellingBooks, createOrGetConversation, removeFromFavorites } from "@/lib/firestore"
import { uploadAvatar } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen, Edit, Heart, MessageSquare, Package, Settings, ShoppingBag, Trash2, Camera, X, Clock
} from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { OfficialIcon } from "../components/official-badge"
import StripeConnectButton from "@/components/stripe-connect-button"

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [sellingBooks, setSellingBooks] = useState<Textbook[]>([])
  const [favorites, setFavorites] = useState<Textbook[]>([])
  const [purchases, setPurchases] = useState<Textbook[]>([])
  const [transactionBooks, setTransactionBooks] = useState<Textbook[]>([])
  const [soldBooks, setSoldBooks] = useState<Textbook[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const { user, userProfile, loading, refreshUserProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      // Stripe設定完了チェック
      if (searchParams.get('stripe_setup') === 'success') {
        const urlAccountId = searchParams.get('account_id')
        const localAccountId = localStorage.getItem('stripe_account_id')
        const stripeAccountId = urlAccountId || localAccountId
        
        console.log('Stripe設定完了処理:', {
          urlAccountId,
          localAccountId,
          stripeAccountId,
          userId: user.uid
        })
        
        if (stripeAccountId) {
          try {
            console.log('Firestoreにアカウント情報を保存中...', stripeAccountId)
            
            // Firestoreのユーザー情報を更新
            await setDoc(doc(db, "users", user.uid), {
              stripeAccountId: stripeAccountId,
            }, { merge: true })
            
            console.log('Firestoreにアカウント情報を保存完了')
            
            // localStorage を削除
            localStorage.removeItem('stripe_account_id')
            
            // プロフィールを更新
            await refreshUserProfile()
            
            alert('Stripe Connectの設定が完了しました！これで決済を受け取ることができます。')
            
            // URLパラメータを削除してページをリロード
            router.replace('/mypage')
            return
          } catch (error) {
            console.error('Stripe Account ID保存エラー:', error)
            alert('設定の保存中にエラーが発生しました。もう一度お試しください。')
          }
        } else {
          console.warn('アカウントIDが見つかりません')
          alert('アカウント情報が見つかりません。もう一度設定してください。')
          router.replace('/mypage')
          return
        }
      }

      // エラーメッセージ処理
      const error = searchParams.get('error')
      if (error === 'missing_account') {
        alert('アカウント情報が見つかりません。もう一度設定してください。')
        router.replace('/mypage')
        return
      } else if (error === 'refresh_failed') {
        alert('設定の更新に失敗しました。もう一度お試しください。')
        router.replace('/mypage')
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

        // 取引中の教科書取得
        try {
          // 購入者として取引中の教科書
          const buyerTransactionsQuery = query(
            collection(db, "books"),
            where("buyerId", "==", user.uid),
            where("transactionStatus", "==", "in_progress")
          )
          const buyerSnapshot = await getDocs(buyerTransactionsQuery)
          
          // 出品者として取引中の教科書（userIdで検索）
          const sellerTransactionsQuery = query(
            collection(db, "books"),
            where("userId", "==", user.uid),
            where("transactionStatus", "==", "in_progress")
          )
          const sellerSnapshot = await getDocs(sellerTransactionsQuery)
          
          const transactionData = [
            ...buyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userRole: 'buyer' } as any)),
            ...sellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userRole: 'seller' } as any))
          ] as Textbook[]
          
          setTransactionBooks(transactionData)
        } catch (transactionError) {
          console.error("取引中教科書取得エラー:", transactionError)
          setTransactionBooks([])
        }

        // 売却履歴取得
        try {
          // 出品者として売却済み（取引完了）の教科書
          const soldBooksQuery = query(
            collection(db, "books"),
            where("userId", "==", user.uid),
            where("status", "==", "sold"),
            where("transactionStatus", "==", "completed")
          )
          const soldSnapshot = await getDocs(soldBooksQuery)
          
          const soldData = soldSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data()
          } as any)) as Textbook[]
          
          setSoldBooks(soldData)
        } catch (soldError) {
          console.error("売却履歴取得エラー:", soldError)
          setSoldBooks([])
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
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">マイページ</h1>
        
        {/* Mobile Profile Header */}
        <div className="md:hidden mb-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userData.avatarUrl || "/placeholder.svg"} alt={userData.fullName} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{userData.fullName}</h2>
                    <OfficialIcon 
                      isOfficial={userData.isOfficial} 
                      officialType={userData.officialType} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{userData.university}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/post-textbook">
                  <Button className="w-full" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />教科書を出品する
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <TabButton label="プロフィール" icon={<Settings />} active={activeTab === "profile"} onClick={() => handleTabChange("profile")} mobile />
            <TabButton label="出品中" icon={<BookOpen />} active={activeTab === "selling"} onClick={() => handleTabChange("selling")} mobile />
            <TabButton label="取引中" icon={<Clock />} active={activeTab === "transactions"} onClick={() => handleTabChange("transactions")} mobile />
            <TabButton label="売却履歴" icon={<Package />} active={activeTab === "sold"} onClick={() => handleTabChange("sold")} mobile />
            <TabButton label="購入履歴" icon={<ShoppingBag />} active={activeTab === "purchased"} onClick={() => handleTabChange("purchased")} mobile />
            <TabButton label="お気に入り" icon={<Heart />} active={activeTab === "favorites"} onClick={() => handleTabChange("favorites")} mobile />
            <TabButton label="メッセージ" icon={<MessageSquare />} active={activeTab === "messages"} onClick={() => handleTabChange("messages")} mobile />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-full md:w-60">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatarUrl || "/placeholder.svg"} alt={userData.fullName} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-bold">{userData.fullName}</h2>
                      <OfficialIcon 
                        isOfficial={userData.isOfficial} 
                        officialType={userData.officialType} 
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{userData.university}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <TabButton label="プロフィール" icon={<Settings />} active={activeTab === "profile"} onClick={() => handleTabChange("profile")} />
                  <TabButton label="出品中の教科書" icon={<BookOpen />} active={activeTab === "selling"} onClick={() => handleTabChange("selling")} />
                  <TabButton label="取引中" icon={<Clock />} active={activeTab === "transactions"} onClick={() => handleTabChange("transactions")} />
                  <TabButton label="売却履歴" icon={<Package />} active={activeTab === "sold"} onClick={() => handleTabChange("sold")} />
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
            {activeTab === "profile" && <ProfileCard user={userData} userProfile={userProfile} />}
            {activeTab === "selling" && <BooksListCard title="出品中の教科書" books={sellingBooks} isEditable />}
            {activeTab === "transactions" && <TransactionBooksCard books={transactionBooks} />}
            {activeTab === "sold" && <BooksListCard title="売却履歴" books={soldBooks} isSold />}
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

function TabButton({ label, icon, active, onClick, mobile = false }: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
  mobile?: boolean
}) {
  if (mobile) {
    return (
      <Button 
        variant={active ? "default" : "outline"} 
        className="flex-shrink-0 text-xs whitespace-nowrap" 
        size="sm"
        onClick={onClick}
      >
        <span className="mr-1">{icon}</span>{label}
      </Button>
    )
  }

  return (
    <Button variant={active ? "default" : "ghost"} className="w-full justify-start" onClick={onClick}>
      <span className="mr-2">{icon}</span>{label}
    </Button>
  )
}

function ProfileCard({ user, userProfile }: { user: UserProfile, userProfile: UserProfile | null }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    fullName: user.fullName,
    university: user.university,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const { user: authUser } = useAuth()

  // アバターファイルが変更された時のプレビュー更新
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズは5MB以下にしてください")
        return
      }
      setAvatarFile(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const handleSave = async () => {
    if (!authUser) return
    
    setIsLoading(true)
    try {
      let newAvatarUrl = user.avatarUrl

      // アバター画像がアップロードされた場合
      if (avatarFile) {
        try {
          console.log("アバター画像アップロード開始...")
          newAvatarUrl = await uploadAvatar(avatarFile, authUser.uid)
          console.log("アバター画像アップロード成功:", newAvatarUrl)
        } catch (avatarError) {
          console.error("アバター画像アップロードエラー:", avatarError)
          alert("アバター画像のアップロードに失敗しました")
          setIsLoading(false)
          return
        }
      }

      // Firestoreのプロフィールを更新
      const userRef = doc(db, "users", authUser.uid)
      await setDoc(userRef, {
        ...user,
        fullName: editData.fullName,
        university: editData.university,
        avatarUrl: newAvatarUrl,
      }, { merge: true })
      
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      alert("プロフィールを更新しました")
      // ページを再読み込みして最新データを表示
      window.location.reload()
    } catch (error) {
      console.error("プロフィール更新エラー:", error)
      alert("プロフィールの更新に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      fullName: user.fullName,
      university: user.university,
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader><CardTitle>プロフィール</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* アバター編集セクション */}
        {isEditing && (
          <div className="space-y-2">
            <label className="text-sm font-medium">プロフィール画像</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarPreview || user.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeAvatar}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  type="button"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  画像を選択
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG (最大5MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {isEditing ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">名前</label>
              <Input
                value={editData.fullName}
                onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="名前を入力"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">大学</label>
              <Input
                value={editData.university}
                onChange={(e) => setEditData(prev => ({ ...prev, university: e.target.value }))}
                placeholder="大学名を入力"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">メール（変更不可）</label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">登録日</label>
              <Input value={user.createdAt?.toDate?.()?.toLocaleDateString() || "不明"} disabled />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">プロフィール画像</p>
                  <p className="text-base">{user.avatarUrl ? "設定済み" : "未設定"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">名前</p>
                <p className="text-base">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">大学</p>
                <p className="text-base">{user.university}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">メール</p>
                <p className="text-base">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">登録日</p>
                <p className="text-base">{user.createdAt?.toDate?.()?.toLocaleDateString() || "不明"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">決済設定（Stripe Connect）</p>
                <div className="flex items-center gap-2 mt-1">
                  {userProfile?.stripeAccountId ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">設定済み</Badge>
                      <span className="text-sm text-muted-foreground">決済を受け取ることができます</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary">未設定</Badge>
                      <p className="text-xs text-muted-foreground">
                        教科書を販売して決済を受け取るには、Stripe Connectの設定が必要です
                      </p>
                      <StripeConnectButton 
                        onConnected={(accountId) => {
                          // アカウント連携完了後の処理
                          window.location.reload()
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {isEditing ? (
          <>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? "保存中..." : "保存"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1">
              キャンセル
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
            <Edit className="mr-2 h-4 w-4" />プロフィールを編集
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function BooksListCard({ title, books, isPurchase = false, isEditable = false, isSold = false, favorites, setFavorites }: {
  title: string
  books: Textbook[]
  isPurchase?: boolean
  isEditable?: boolean
  isSold?: boolean
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

  const formatSoldDate = (completedAt: any) => {
    if (!completedAt) return "不明"
    
    try {
      // Timestamp オブジェクトの場合
      if (completedAt.toDate) {
        return completedAt.toDate().toLocaleDateString('ja-JP')
      }
      // 秒数の場合
      if (completedAt.seconds) {
        return new Date(completedAt.seconds * 1000).toLocaleDateString('ja-JP')
      }
      // Date オブジェクトの場合
      if (completedAt instanceof Date) {
        return completedAt.toLocaleDateString('ja-JP')
      }
      return String(completedAt)
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
            ) : isSold ? (
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
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
                : isSold
                ? "売却した教科書はまだありません"
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
          <Card key={book.id} className="p-3 md:p-4">
            <div className="flex gap-3 md:gap-4">
              <img src={book.imageUrl || "/placeholder.svg"} alt={book.title} className="w-16 h-20 md:w-20 md:h-28 object-cover rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-lg truncate">{book.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{book.author}</p>
                <p className="text-xs md:text-sm">価格：¥{book.price?.toLocaleString()}</p>
                {book.status === 'sold' && <p className="text-xs md:text-sm text-red-500">売切済</p>}
                {book.status === 'reserved' && <p className="text-xs md:text-sm text-yellow-500">予約済</p>}
                {book.status === 'available' && isEditable && <p className="text-xs md:text-sm text-green-500">出品中</p>}
                {isPurchase && <p className="text-xs md:text-sm">購入日：{formatPurchaseDate(book.purchasedAt)}</p>}
                {isSold && <p className="text-xs md:text-sm text-green-600">売却日：{formatSoldDate(book.completedAt)}</p>}
                <div className="mt-2 flex flex-col sm:flex-row gap-1 sm:gap-2">
                  {isFavorites && (
                    <>
                      <Link href={`/marketplace/${book.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <BookOpen className="mr-1 h-3 w-3" /> 詳細
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => handleRemoveFromFavorites(book)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> 削除
                      </Button>
                    </>
                  )}
                  {isPurchase && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleMessageSeller(book)}
                    >
                      <MessageSquare className="mr-1 h-3 w-3" /> 出品者に連絡
                    </Button>
                  )}
                  {isSold && (
                    <Link href={`/marketplace/${book.id}`} className="flex-1 sm:flex-none">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <BookOpen className="mr-1 h-3 w-3" /> 詳細
                      </Button>
                    </Link>
                  )}
                  {isEditable && (
                    <>
                      <Link href={`/marketplace/${book.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <BookOpen className="mr-1 h-3 w-3" /> 詳細
                        </Button>
                      </Link>
                      <Link href={`/edit/${book.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Edit className="mr-1 h-3 w-3" /> 編集
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

function TransactionBooksCard({ books }: { books: Textbook[] }) {
  const { user } = useAuth()
  const router = useRouter()
  
  const handleMessageOtherParty = async (book: any) => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      // 既存の会話を検索
      const conversationsRef = collection(db, "conversations")
      const conversationQuery = query(
        conversationsRef,
        where("bookId", "==", book.id)
      )
      const conversationSnapshot = await getDocs(conversationQuery)
      
      if (!conversationSnapshot.empty) {
        // 既存の会話から現在のユーザーが参加している正しい会話を探す
        let targetConversation = null
        
        for (const doc of conversationSnapshot.docs) {
          const data = doc.data()
          
          // 出品者(seller)の場合は sellerId が一致する会話を優先
          if (book.userRole === 'seller' && data.sellerId === user.uid) {
            targetConversation = doc
            break
          }
          // 購入者(buyer)の場合は buyerId が一致する会話を優先  
          else if (book.userRole === 'buyer' && data.buyerId === user.uid) {
            targetConversation = doc
            break
          }
          // フォールバック: どちらかが一致すれば選択
          else if (data.buyerId === user.uid || data.sellerId === user.uid) {
            if (!targetConversation) {
              targetConversation = doc
            }
          }
        }
        
        if (targetConversation) {
          router.push(`/messages/${targetConversation.id}`)
        } else {
          alert("該当する会話が見つかりませんでした")
        }
      } else {
        // 既存の会話がない場合は新規作成
        const otherUserId = book.userRole === 'buyer' ? book.userId : book.buyerId
        const conversationId = await createOrGetConversation(
          user.uid,
          otherUserId,
          book.id
        )
        router.push(`/messages/${conversationId}`)
      }
    } catch (error) {
      console.error("会話検索エラー:", error)
      alert("メッセージ画面への遷移に失敗しました")
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>取引中</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {books.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              取引中の教科書はありません
            </p>
          </div>
        ) : books.map((book: any) => (
          <Card key={book.id} className="p-3 md:p-4">
            <div className="flex gap-3 md:gap-4">
              <img src={book.imageUrl || "/placeholder.svg"} alt={book.title} className="w-16 h-20 md:w-20 md:h-28 object-cover rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-lg truncate">{book.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{book.author}</p>
                <p className="text-xs md:text-sm">価格：¥{book.price?.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={book.userRole === 'buyer' ? 'default' : 'secondary'} className="text-xs">
                    {book.userRole === 'buyer' ? '購入者' : '出品者'}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                    取引中
                  </Badge>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <Link href={`/marketplace/${book.id}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <BookOpen className="mr-1 h-3 w-3" /> 商品詳細
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleMessageOtherParty(book)}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" /> メッセージ
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}