"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { uploadImages } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Trash2 } from "lucide-react"
import { EditImageUpload } from "./EditImageUpload"

export default function EditBookPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    condition: "",
    faculty: "",
    description: "",
    meetupLocation: ""
  })
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchBook = async () => {
      const docRef = doc(db, "books", bookId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData({
          title: data.title || "",
          author: data.author || "",
          price: data.price?.toString() || "",
          condition: data.condition || "",
          faculty: data.faculty || "",
          description: data.description || "",
          meetupLocation: data.meetupLocation || "",
        })
        
        // 既存画像の設定（新しい形式と古い形式の両方に対応）
        if (data.imageUrls && Array.isArray(data.imageUrls)) {
          setExistingImageUrls(data.imageUrls)
        } else if (data.imageUrl) {
          setExistingImageUrls([data.imageUrl])
        } else {
          setExistingImageUrls([])
        }
      } else {
        alert("教科書が見つかりませんでした")
        router.push("/mypage")
      }
      setLoading(false)
    }
    fetchBook()
  }, [bookId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 価格のバリデーション
    const price = parseFloat(formData.price)
    if (price < 300) {
      alert("価格は300円以上で設定してください。")
      return
    }

    // 画像が1枚もない場合はエラー
    if (existingImageUrls.length === 0 && newImages.length === 0) {
      alert("少なくとも1枚の画像を選択してください。")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 新しい画像をアップロード
      let uploadedImageUrls: string[] = []
      if (newImages.length > 0) {
        uploadedImageUrls = await uploadImages(newImages, bookId)
      }
      
      // 最終的な画像URL配列（既存 + 新規）
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls]
      
      const docRef = doc(db, "books", bookId)
      await updateDoc(docRef, {
        ...formData,
        price: price,
        imageUrls: finalImageUrls,
        imageUrl: finalImageUrls[0] || null, // 下位互換性のため
      })
      
      alert("教科書情報を更新しました！")
      router.push("/mypage")
    } catch (error) {
      console.error("更新エラー:", error)
      alert("更新中にエラーが発生しました。もう一度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      "本当にこの出品を取り消しますか？\n\n取り消すと：\n・出品一覧から削除されます\n・進行中のメッセージも削除されます\n・この操作は元に戻せません"
    )
    
    if (!isConfirmed) return

    try {
      setIsDeleting(true)
      const docRef = doc(db, "books", bookId)
      await deleteDoc(docRef)
      alert("出品を取り消しました")
      router.push("/mypage")
    } catch (error) {
      console.error("削除エラー:", error)
      alert("出品の取り消しに失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <div className="container py-10">読み込み中...</div>

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Link href="/mypage" className="flex items-center text-muted-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />マイページに戻る
      </Link>

      <h1 className="text-3xl font-bold mb-4 text-center">教科書情報の編集</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
        <p className="text-blue-800 font-medium text-center">
          教科書の情報を編集できます。価格や取引場所などを自由に変更可能です。
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>教科書の情報を編集</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="author">著者</Label>
                  <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">価格（円）- 手数料込み</Label>
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
                  <p className="text-sm text-muted-foreground">
                    手数料10%が含まれています。最低金額は300円です。
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="condition">状態</Label>
                  <Select onValueChange={(value) => handleSelectChange("condition", value)} defaultValue={formData.condition}>
                    <SelectTrigger id="condition"><SelectValue placeholder="状態を選択" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="新品">新品</SelectItem>
                      <SelectItem value="ほぼ新品">ほぼ新品</SelectItem>
                      <SelectItem value="良好">良好</SelectItem>
                      <SelectItem value="書き込みあり">書き込みあり</SelectItem>
                      <SelectItem value="使用感あり">使用感あり</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meetupLocation">希望取引場所</Label>
                  <Input id="meetupLocation" name="meetupLocation" value={formData.meetupLocation} onChange={handleChange} placeholder="例: 大学1号館前、学生食堂" required />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>教科書の画像</Label>
                  <EditImageUpload
                    existingImageUrls={existingImageUrls}
                    newImages={newImages}
                    setExistingImageUrls={setExistingImageUrls}
                    setNewImages={setNewImages}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">商品の説明</Label>
                  <Textarea id="description" name="description" rows={6} value={formData.description} onChange={handleChange} required />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/mypage")}>キャンセル</Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  "取り消し中..."
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    出品取り消し
                  </>
                )}
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "更新中..." : "更新する"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
