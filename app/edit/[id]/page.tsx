"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, Trash2 } from "lucide-react"

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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

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
        setImagePreview(data.imageUrl || null)
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const docRef = doc(db, "books", bookId)
    await updateDoc(docRef, {
      ...formData,
      price: 0, // テスト運用中は0円固定
      imageUrl: imagePreview,
    })
    alert("教科書情報を更新しました！")
    router.push("/mypage")
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
      
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg max-w-2xl mx-auto">
        <p className="text-orange-800 font-medium text-center">
          🧪 <strong>テスト運用中</strong> - 価格は0円固定です。取引場所は編集できます。
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
                  <Label htmlFor="price">価格（円）- テスト運用中は0円固定</Label>
                  <Input id="price" name="price" type="number" value="0" disabled className="bg-gray-100" />
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
                  <div className="relative border-2 border-dashed rounded-lg px-4 pt-4 pb-2 text-center max-w-xs mx-auto">
                    {imagePreview ? (
                      <div className="relative aspect-[3/4] w-full mx-auto">
                        <img src={imagePreview} alt="プレビュー" className="object-contain w-full h-full" />
                        <Button type="button" variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => setImagePreview(null)}>削除</Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-4">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-1 text-sm text-muted-foreground">画像をアップロード</p>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
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
            <Button type="submit">更新する</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
