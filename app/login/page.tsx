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
import { loginUser, checkEmailVerification, resendVerificationEmail } from "@/lib/firebaseAuth" // ✅ 追加
import { usePageTracking } from "@/lib/usePageTracking"

export default function LoginPage() {
  const router = useRouter()
  
  // ページビューを記録
  usePageTracking('/login')
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [userEmail, setUserEmail] = useState("")

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

      // メール認証チェック（一時的に無効化）
      // const isEmailVerified = checkEmailVerification(user)
      // console.log("メール認証状態:", isEmailVerified)

      // if (!isEmailVerified) {
      //   console.log("メール未認証のため認証画面を表示")
      //   setUserEmail(formData.email)
      //   setShowEmailVerification(true)
      //   return
      // }

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
      } else if (error.code === "auth/invalid-credential") {
        errorMsg = "メールアドレスまたはパスワードが間違っています"
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

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail()
      alert("認証メールを再送信しました。メールボックスをご確認ください。")
    } catch (error: any) {
      console.error("認証メール再送信エラー:", error)
      alert("認証メールの再送信に失敗しました。")
    }
  }

  // メール認証待ち画面
  if (showEmailVerification) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto py-10 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-orange-600">メール認証が必要です</CardTitle>
              <CardDescription>アカウントを有効化してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-6xl mb-4">📧</div>
              <p className="text-sm text-muted-foreground">
                <strong>{userEmail}</strong> にメール認証が必要です。
              </p>
              <p className="text-sm text-muted-foreground">
                受信箱のメールから認証を完了してください。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-yellow-800">
                  ⚠️ 認証完了後、再度ログインしてください
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
              >
                認証メールを再送信
              </Button>
              <Button 
                onClick={() => {
                  setShowEmailVerification(false)
                  setFormData({ email: "", password: "", rememberMe: false })
                }} 
                className="w-full"
              >
                ログイン画面に戻る
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    )
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
