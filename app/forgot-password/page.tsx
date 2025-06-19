"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("メールアドレスを入力してください")
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("有効なメールアドレスを入力してください")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Here you would typically send the request to your backend API
      console.log("Password reset requested for:", email)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      setIsSubmitted(true)
    } catch (error) {
      console.error("Password reset error:", error)
      setError("パスワードリセットリクエストの送信中にエラーが発生しました。後でもう一度お試しください。")
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
            <CardTitle className="text-2xl font-bold text-center">パスワードをお忘れですか？</CardTitle>
            <CardDescription className="text-center">
              アカウントに関連付けられたメールアドレスを入力してください。パスワードリセットのリンクをお送りします。
            </CardDescription>
          </CardHeader>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@university.ac.jp"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "送信中..." : "リセットリンクを送信"}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="text-primary hover:underline">
                    ログインページに戻る
                  </Link>
                </div>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-medium">メールを送信しました</h3>
              <p className="text-muted-foreground">
                {email} にパスワードリセットのリンクを送信しました。メールをご確認ください。
              </p>
              <Button asChild className="mt-4">
                <Link href="/login">ログインページに戻る</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  )
}
