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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="flex-1 container mx-auto py-6 md:py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 戻るボタン */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg py-8">
              <CardTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3">
                <DollarSign className="h-8 w-8 md:h-10 md:w-10" />
                Stripe Connect 設定が必要です
              </CardTitle>
              <p className="text-blue-100 mt-2 text-sm md:text-base">
                安全で確実な決済システムの設定を行います
              </p>
            </CardHeader>
            <CardContent className="space-y-8 p-6 md:p-8">
              {/* メインメッセージ */}
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <p className="text-lg md:text-xl font-medium text-gray-900 leading-relaxed">
                  TextMatchで教科書を販売するには<br className="md:hidden" />
                  Stripe Connectアカウントの設定が必要です
                </p>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  安全で確実な決済システムを提供するため、<br className="md:hidden" />
                  当サービスではStripe Connectを利用しています
                </p>
              </div>

              {/* Stripe Connectの特徴 */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 text-center">なぜStripe Connectが必要なの？</h3>
                <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-green-900 text-lg">安全な決済処理</h4>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">
                      世界最高水準のセキュリティで、<br />
                      クレジットカード情報を<br />
                      安全に処理します
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-blue-900 text-lg">迅速な入金</h4>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      売上は直接あなたの<br />
                      銀行口座に入金されます<br />
                      （手動出金設定）
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100 shadow-sm md:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-purple-900 text-lg">法令遵守</h4>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">
                      資金決済法などの法規制に<br />
                      完全対応した<br />
                      決済システムです
                    </p>
                  </div>
                </div>
              </div>

              {/* 設定手順 */}
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 text-center">設定の流れ</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">1</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">アカウント作成</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        下のボタンから<br />
                        Stripe Connectアカウントを作成
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">2</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">基本情報入力</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        名前、住所、銀行口座などの<br />
                        必要な情報を入力
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">3</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">本人確認</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        本人確認書類を<br />
                        アップロード
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">✓</div>
                    <div className="flex-1">
                      <p className="font-medium text-green-700 mb-1">設定完了！</p>
                      <p className="text-sm text-green-600 leading-relaxed">
                        教科書の販売を<br />
                        開始できます
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 入力内容のガイド */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-200 rounded-full mt-1">
                    <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-900 mb-3 text-lg">設定時の入力内容ガイド</p>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-semibold text-blue-900 mb-2">📋 事業形態</p>
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">「個人事業主」</span>を選択してください
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-semibold text-blue-900 mb-2">🌐 ウェブサイトURL</p>
                        <p className="text-sm text-blue-800">
                          <span className="font-medium font-mono">https://text-match.jp</span><br />
                          上記URLを入力してください
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="font-semibold text-blue-900 mb-2">💼 事業内容・商品説明</p>
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">「TextMatchで教科書の販売」</span><br />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 法的注意事項 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-200 rounded-full mt-1">
                    <svg className="w-4 h-4 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 mb-2">重要事項</p>
                    <div className="space-y-2">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        <strong>• 個人事業主として申請：</strong> 年収20万円を超える場合は確定申告が必要です
                      </p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        <strong>• 古物商許可：</strong> 中古品の継続的販売には古物商許可が必要な場合があります
                      </p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        <strong>• 設定は販売者のみ：</strong> 購入のみの場合は設定不要です
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stripe Connect設定ボタン */}
              <div className="text-center space-y-6">
                <div className="bg-white p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                  <StripeConnectButton 
                    className="w-full max-w-md mx-auto text-lg py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                    onConnected={() => {
                      // 設定完了後は元のページに戻る
                      router.push(`${returnTo}?stripe_setup=success`)
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    設定にはStripeの外部サイトに移動します。<br />
                    所要時間は約5-10分です。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}