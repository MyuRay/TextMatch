"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { Eye, EyeOff } from "lucide-react"
import { loginUser } from "@/lib/firebaseAuth" // ✅ 追加

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "メールアドレスを入力してください"
    }
    if (!formData.password) {
      newErrors.password = "パスワードを入力してください"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // ✅ Firebase Auth によるログイン
      console.log("ログイン試行開始:", formData.email)
      const user = await loginUser(formData.email, formData.password)
      console.log("ログイン成功:", user)

      // ✅ トップページに遷移して Header を再描画
      router.push("/")
    } catch (error: any) {
      console.error("ログインエラー詳細:", error)
      console.error("エラーコード:", error.code)
      console.error("エラーメッセージ:", error.message)
      
      let errorMsg = "ログインに失敗しました"
      if (error.code === "auth/user-not-found") {
        errorMsg = "このメールアドレスは登録されていません"
      } else if (error.code === "auth/wrong-password") {
        errorMsg = "パスワードが間違っています"
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "無効なメールアドレスです"
      } else if (error.code === "auth/user-disabled") {
        errorMsg = "このアカウントは無効化されています"
      } else if (error.code === "auth/too-many-requests") {
        errorMsg = "ログイン試行回数が多すぎます。しばらく待ってからお試しください"
      } else {
        errorMsg = `ログインに失敗しました: ${error.message}`
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
            <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
            <CardDescription className="text-center">アカウントにログインして続行</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@university.ac.jp"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">パスワード</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    パスワードをお忘れですか？
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワードを入力"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "パスワードを隠す" : "パスワードを表示"}</span>
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, rememberMe: checked === true }))
                  }
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  ログイン状態を保持する
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "ログイン中..." : "ログイン"}
              </Button>

              <div className="text-center text-sm">
                アカウントをお持ちでないですか？{" "}
                <Link href="/register" className="text-primary hover:underline">
                  新規登録
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
