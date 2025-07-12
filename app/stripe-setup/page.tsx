"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, DollarSign, Shield, Zap, ArrowLeft } from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { useAuth } from "@/lib/useAuth"
import StripeConnectButton from "@/components/stripe-connect-button"

export default function StripeSetupPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('return_to') || '/post-textbook'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    // すでにStripe Connect設定済みの場合は元のページに戻る
    if (userProfile?.stripeAccountId) {
      router.push(returnTo)
    }
  }, [userProfile, router, returnTo])

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  if (!user) {
    return <div className="p-8 text-center">ログインが必要です</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 戻るボタン */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
                <DollarSign className="h-8 w-8" />
                Stripe Connect 設定が必要です
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* メインメッセージ */}
              <div className="text-center space-y-4">
                <p className="text-lg font-medium text-gray-900">
                  TextMatchで教科書を販売するには、Stripe Connectアカウントの設定が必要です
                </p>
                <p className="text-muted-foreground">
                  安全で確実な決済システムを提供するため、当サービスではStripe Connectを利用しています
                </p>
              </div>

              {/* Stripe Connectの特徴 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">なぜStripe Connectが必要なの？</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900">安全な決済処理</h4>
                      <p className="text-sm text-green-800">
                        世界最高水準のセキュリティで、クレジットカード情報を安全に処理します
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900">迅速な入金</h4>
                      <p className="text-sm text-blue-800">
                        売上は直接あなたの銀行口座に入金されます（手動出金設定）
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-purple-900">法令遵守</h4>
                      <p className="text-sm text-purple-800">
                        資金決済法などの法規制に完全対応した決済システムです
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 設定手順 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">設定の流れ</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <p className="text-sm">下のボタンからStripe Connectアカウントを作成</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <p className="text-sm">基本情報（名前、住所、銀行口座など）を入力</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <p className="text-sm">本人確認書類をアップロード</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                    <p className="text-sm font-medium text-green-700">設定完了！教科書の販売を開始できます</p>
                  </div>
                </div>
              </div>

              {/* Stripe Connect設定ボタン */}
              <div className="text-center space-y-4">
                <StripeConnectButton 
                  className="w-full"
                  onConnected={() => {
                    // 設定完了後は元のページに戻る
                    router.push(`${returnTo}?stripe_setup=success`)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  設定にはStripeの外部サイトに移動します。所要時間は約5-10分です。
                </p>
              </div>

              {/* 注意事項 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>ご注意：</strong> Stripe Connectの設定は販売者のみに必要です。
                  教科書の購入のみを行う場合は設定不要です。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}