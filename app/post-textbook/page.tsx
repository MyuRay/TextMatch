"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"
import { fetchBookByISBN } from "./isbn-service"
import { fetchImageAsFile } from "@/lib/imageUtils"
import { Loader2, HelpCircle } from "lucide-react"
import { addTextbook } from "@/lib/firestore"
import { uploadImage } from "@/lib/storage"
import { getAuth } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import { useAuth } from "@/lib/useAuth"
import { usePageTracking } from "@/lib/usePageTracking"

export default function PostTextbookPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  
  // ページビューを記録
  usePageTracking('/post-textbook')
  
  // デバッグ用ログ
  console.log("Auth状態:", { user, userProfile, loading })
  console.log("stripeAccountId:", userProfile?.stripeAccountId)
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    description: "",
    price: "",
    condition: "",
    meetupLocation: "",
    expirationDate: "",
    genre: "",
  })

  const [images, setImages] = useState<File[]>([])
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isISBNDialogOpen, setIsISBNDialogOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFetchFromISBN = async () => {
    if (!formData.isbn) return
    setIsLoading(true)
    try {
      const bookData = await fetchBookByISBN(formData.isbn)
      setFormData((prev) => ({
        ...prev,
        title: bookData.title,
        author: bookData.author,
        description: bookData.description || prev.description,
      }))
      
      // 表紙画像URLを設定
      if (bookData.coverImageUrl) {
        console.log("表紙画像URL取得:", bookData.coverImageUrl)
        setCoverImageUrl(bookData.coverImageUrl)
      } else {
        console.log("表紙画像が見つかりませんでした")
        setCoverImageUrl(null)
      }
    } catch (error) {
      console.error("書籍情報取得エラー:", error)
      alert("書籍情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseCoverImage = async () => {
    if (!coverImageUrl) return
    
    setIsLoading(true)
    try {
      console.log("表紙画像をファイルに変換中...")
      const fileName = `cover-${formData.isbn || 'unknown'}`
      const coverFile = await fetchImageAsFile(coverImageUrl, fileName)
      
      setImages([coverFile, ...images])
      console.log("表紙画像設定完了")
      setCoverImageUrl(null) // プレビューを非表示に
    } catch (error) {
      console.error("表紙画像の設定に失敗:", error)
      
      // フォールバック: 手動での画像設定を促す
      const useManually = confirm(
        "表紙画像の自動設定に失敗しました。\n" +
        "代わりに手動で画像をアップロードしますか？\n\n" +
        "「OK」を押すとファイル選択ダイアログが開きます。"
      )
      
      if (useManually) {
        // ファイル選択ダイアログを開く
        const fileInput = document.getElementById("image-upload") as HTMLInputElement
        fileInput?.click()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("handleSubmit called")
    console.log("userProfile in handleSubmit:", userProfile)
    console.log("stripeAccountId in handleSubmit:", userProfile?.stripeAccountId)
    
    // Stripe Connect設定チェック
    if (userProfile?.stripeAccountId === undefined) {
      console.log("stripeAccountId未設定のため、説明画面にリダイレクト")
      alert("教科書を出品するにはStripe Connectの設定が必要です。\n設定画面に移動します。")
      router.push("/stripe-setup?return_to=/post-textbook")
      return
    }
    
    console.log("Stripe設定済み、出品処理続行")
    
    setIsLoading(true)

    try {
      // 価格のバリデーション
      const price = parseFloat(formData.price)
      if (price < 300) {
        alert("価格は300円以上で設定してください")
        setIsLoading(false)
        return
      }

      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("ログインしていません")

      // Stripe Connect設定チェック
      if (!userProfile?.stripeAccountId) {
        setIsLoading(false)
        router.push("/stripe-setup?return_to=/post-textbook")
        return
      }

      const userDoc = await getDoc(doc(db, "users", user.uid))
      const university = userDoc.exists() ? userDoc.data().university : ""
      const sellerName = userDoc.exists() ? userDoc.data().fullName : ""

      // 複数画像をアップロード
      const imageUrls: string[] = []
      if (images.length > 0) {
        try {
          console.log(`${images.length}枚の画像をアップロード中...`)
          for (let i = 0; i < images.length; i++) {
            console.log(`画像 ${i + 1}/${images.length} をアップロード中...`)
            const imageUrl = await uploadImage(images[i])
            imageUrls.push(imageUrl)
          }
          console.log("全ての画像アップロード完了:", imageUrls)
        } catch (uploadError: any) {
          throw new Error(`画像のアップロードに失敗しました: ${uploadError.message}`)
        }
      }

      await addTextbook({
        isbn: formData.isbn,
        title: formData.title,
        author: formData.author,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        condition: formData.condition,
        meetupLocation: formData.meetupLocation,
        imageUrls: imageUrls,
        imageUrl: imageUrls[0] || "", // メイン画像（後方互換性のため）
        userId: user.uid,
        university,
        sellerName,
        expirationDate: formData.expirationDate || null,
        genre: formData.genre,
      })

      alert("教科書を出品しました！")
      router.push("/marketplace")
    } catch (error: any) {
      let errorMessage = "出品に失敗しました"
      if (error.message) {
        errorMessage += `: ${error.message}`
      }
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>教科書を出品</CardTitle>
            <CardDescription>
              以下のフォームに記入して、教科書を出品してください。<br />
              <span className="text-blue-600 font-medium">※希望する価格を設定してください。</span>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <span className="text-sm text-muted-foreground">（任意）</span>
                  <Dialog open={isISBNDialogOpen} onOpenChange={setIsISBNDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>📚 ISBNについて</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">ISBNとは？</h4>
                            <p className="text-muted-foreground">
                              ISBN（International Standard Book Number）は、国際標準図書番号のことで、
                              本を識別するための13桁の番号です。
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">どこに書いてある？</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>• 本の裏表紙（バーコードの下）</li>
                                <li>• 奥付（本の最後のページ）</li>
                                <li>• 版権ページ（タイトルページの裏）</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">入力例</h4>
                            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                              <p className="text-sm">
                                <strong>正しい形式：</strong> 978-4-123-45678-9<br/>
                                <strong>入力時：</strong> 9784123456789
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            <p><strong>注意：</strong> ISBNが分からない場合は空欄のままでも出品できます。</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex space-x-2">
                  <Input id="isbn" name="isbn" placeholder="例: 9784123456789" value={formData.isbn} onChange={handleChange} />
                  <Button type="button" onClick={handleFetchFromISBN} disabled={isLoading || !formData.isbn}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...</> : "ISBNから取得"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ISBNを入力すると、書籍情報を自動取得できます。
                  <span 
                    className="text-blue-600 cursor-pointer hover:underline ml-1"
                    onClick={() => setIsISBNDialogOpen(true)}
                  >
                    （ISBNとは？）
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">タイトル</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">著者</Label>
                <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">価格 (¥) 手数料込み</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  value={formData.price} 
                  onChange={handleChange}
                  placeholder="例: 1500"
                  min="300"
                  step="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  最低金額は300円です。取引手数料10%が含まれた価格を設定してください。
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre">ジャンル</Label>
                <Select onValueChange={(value) => handleSelectChange("genre", value)} required>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="ジャンルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="textbook">講義参考書</SelectItem>
                    <SelectItem value="certification">資格書</SelectItem>
                    <SelectItem value="jobhunting">就活関連書</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">状態</Label>
                <Select onValueChange={(value) => handleSelectChange("condition", value)} required>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="状態を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">新品</SelectItem>
                    <SelectItem value="like_new">ほぼ新品</SelectItem>
                    <SelectItem value="good">良好</SelectItem>
                    <SelectItem value="fair">普通</SelectItem>
                    <SelectItem value="poor">傷あり</SelectItem>
                    <SelectItem value="written">書き込みあり</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetupLocation">希望取引場所</Label>
                <Input 
                  id="meetupLocation" 
                  name="meetupLocation" 
                  placeholder="安全な取引のため、キャンパス内の人が多い場所を指定してください（例：図書館前、学生食堂など）"
                  className="text-sm placeholder:text-xs"
                  value={formData.meetupLocation} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="expirationDate">出品期限</Label>
                  <span className="text-sm text-muted-foreground">（任意）</span>
                </div>
                <Input 
                  id="expirationDate" 
                  name="expirationDate" 
                  type="date"
                  value={formData.expirationDate} 
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  指定した日付以降、この出品は自動的に非表示になります
                </p>
              </div>
              <div className="space-y-2">
                <Label>教科書の画像</Label>
                <ImageUpload 
                  images={images}
                  setImages={setImages}
                  coverImageUrl={coverImageUrl || undefined}
                  onUseCoverImage={handleUseCoverImage}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                onClick={(e) => {
                  console.log("Button clicked, userProfile:", userProfile)
                  console.log("Button clicked, stripeAccountId:", userProfile?.stripeAccountId)
                  console.log("Button clicked, stripeAccountId === undefined:", userProfile?.stripeAccountId === undefined)
                  
                  // Stripe設定チェックを直接実行
                  if (userProfile?.stripeAccountId === undefined) {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log("stripeAccountId未設定のため、説明画面にリダイレクト")
                    alert("教科書を出品するにはStripe Connectの設定が必要です。\n設定画面に移動します。")
                    setTimeout(() => {
                      router.push("/stripe-setup?return_to=/post-textbook")
                    }, 100)
                    return
                  }
                }}
              >
                {isLoading ? "出品中..." : "教科書を出品"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
