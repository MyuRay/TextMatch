"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "./image-upload"
import { fetchBookByISBN } from "./isbn-service"
import { fetchImageAsFile } from "@/lib/imageUtils"
import { Loader2 } from "lucide-react"
import { addTextbook } from "@/lib/firestore"
import { uploadImage } from "@/lib/storage"
import { getAuth } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"

export default function PostTextbookPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    description: "",
    price: "",
    condition: "",
    meetupLocation: "",
  })

  const [images, setImages] = useState<File[]>([])
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)

    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) throw new Error("ログインしていません")

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
        price: Number(formData.price),
        condition: formData.condition,
        meetupLocation: formData.meetupLocation,
        imageUrls: imageUrls,
        imageUrl: imageUrls[0] || "", // メイン画像（後方互換性のため）
        userId: user.uid,
        university,
        sellerName,
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
            <CardDescription>以下のフォームに記入して、教科書を出品してください。</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <div className="flex space-x-2">
                  <Input id="isbn" name="isbn" placeholder="ISBNを入力" value={formData.isbn} onChange={handleChange} />
                  <Button type="button" onClick={handleFetchFromISBN} disabled={isLoading || !formData.isbn}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...</> : "ISBNから取得"}
                  </Button>
                </div>
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
                <Label htmlFor="price">価格 (¥)</Label>
                <Input id="price" name="price" type="number" min="0" step="1" value={formData.price} onChange={handleChange} required />
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
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetupLocation">希望取引場所</Label>
                <Input id="meetupLocation" name="meetupLocation" value={formData.meetupLocation} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>教科書の画像</Label>
                <ImageUpload 
                  images={images}
                  setImages={setImages}
                  coverImageUrl={coverImageUrl}
                  onUseCoverImage={handleUseCoverImage}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
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
