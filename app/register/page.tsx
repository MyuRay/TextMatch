"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { Eye, EyeOff } from "lucide-react"
import { registerUser } from "@/lib/firebaseAuth"
import { saveUserProfile } from "@/lib/firestore"

// 主要な大学のリスト
const UNIVERSITIES = [
  "東京大学", "京都大学", "大阪大学", "名古屋大学", "東北大学", "九州大学", "北海道大学",
  "筑波大学", "広島大学", "神戸大学", "早稲田大学", "慶應義塾大学", "上智大学", "東京工業大学", "一橋大学",
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    university: "",
    department: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false)
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "university" && value.trim()) {
      const suggestions = UNIVERSITIES.filter((uni) =>
        uni.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setUniversitySuggestions(suggestions)
      setShowUniversitySuggestions(suggestions.length > 0)
    } else if (name === "university") {
      setShowUniversitySuggestions(false)
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectUniversity = (university: string) => {
    setFormData((prev) => ({ ...prev, university }))
    setShowUniversitySuggestions(false)
    if (errors.university) {
      setErrors((prev) => ({ ...prev, university: "" }))
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }))
    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = "氏名を入力してください"
    if (!formData.email) newErrors.email = "メールアドレスを入力してください"
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "有効なメールアドレスを入力してください"
    if (!formData.studentId) newErrors.studentId = "学籍番号を入力してください"
    if (!formData.university) newErrors.university = "大学名を入力してください"
    if (!formData.password) newErrors.password = "パスワードを入力してください"
    else if (formData.password.length < 8) newErrors.password = "パスワードは8文字以上で入力してください"
    if (!formData.confirmPassword) newErrors.confirmPassword = "パスワードを再入力してください"
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "パスワードが一致しません"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      console.log("登録開始:", formData.email)
      const user = await registerUser(formData.email, formData.password)
      console.log("Firebase Auth登録成功:", user.uid)

      await saveUserProfile(user.uid, {
        fullName: formData.fullName,
        email: formData.email,
        studentId: formData.studentId,
        university: formData.university,
        department: formData.department,
      })
      console.log("プロフィール保存成功")

      alert("アカウント登録が完了しました！")
      router.push("/login")
    } catch (error: any) {
      console.error("登録エラー詳細:", error)
      console.error("エラーコード:", error.code)
      console.error("エラーメッセージ:", error.message)
      
      let errorMsg = "登録に失敗しました"
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "このメールアドレスは既に使用されています"
      } else if (error.code === "auth/weak-password") {
        errorMsg = "パスワードが弱すぎます（6文字以上必要）"
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "無効なメールアドレスです"
      } else {
        errorMsg = `登録に失敗しました: ${error.message}`
      }
      
      alert(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">アカウント登録</CardTitle>
            <CardDescription className="text-center">Campus Booksに登録して教科書の売買を始めましょう</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">氏名</Label>
                <Input id="fullName" name="fullName" placeholder="山田 太郎" value={formData.fullName} onChange={handleChange} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" placeholder="example@university.ac.jp" value={formData.email} onChange={handleChange} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">学籍番号</Label>
                <Input id="studentId" name="studentId" placeholder="12345678" value={formData.studentId} onChange={handleChange} />
                {errors.studentId && <p className="text-sm text-destructive">{errors.studentId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">大学名</Label>
                <div className="relative">
                  <Input
                    id="university"
                    name="university"
                    placeholder="〇〇大学"
                    value={formData.university}
                    onChange={handleChange}
                    onFocus={() => universitySuggestions.length > 0 && setShowUniversitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)}
                  />
                  {showUniversitySuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                      <ul className="py-1">
                        {universitySuggestions.map((uni) => (
                          <li key={uni} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => handleSelectUniversity(uni)}>
                            {uni}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {errors.university && <p className="text-sm text-destructive">{errors.university}</p>}
              </div>

              <div className="space-y-2">
                {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="8文字以上" value={formData.password} onChange={handleChange} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="パスワードを再入力" value={formData.confirmPassword} onChange={handleChange} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "登録中..." : "登録する"}
              </Button>
              <div className="text-center text-sm">
                すでにアカウントをお持ちですか？{" "}
                <Link href="/login" className="text-primary hover:underline">
                  ログイン
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
