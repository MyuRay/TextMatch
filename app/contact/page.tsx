"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram, Twitter, Mail } from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function ContactPage() {

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
            <p className="text-lg text-gray-600">
              ご質問やご要望がございましたら、お気軽にお問い合わせください
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* SNS連絡先 */}
            <Card className="shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="text-center">お気軽にご連絡ください</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <a
                  href="mailto:info@textmatch.info?subject=TextMatchに関するお問い合わせ&body=お問い合わせ内容をご記載ください。"
                  className="flex items-center gap-4 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
                >
                  <Mail className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-semibold text-lg">メール</p>
                    <p className="text-sm opacity-90">info@textmatch.info</p>
                    <p className="text-xs opacity-75 mt-1">お気軽にメールでお問い合わせください</p>
                  </div>
                </a>

                <a
                  href="https://instagram.com/masato.__.2004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors group"
                >
                  <Instagram className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-semibold text-lg">Instagram</p>
                    <p className="text-sm opacity-90">@masato.__.2004</p>
                    <p className="text-xs opacity-75 mt-1">DMでお気軽にご連絡ください</p>
                  </div>
                </a>

                <a
                  href="https://x.com/myu_rararara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  <Twitter className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-semibold text-lg">X (Twitter)</p>
                    <p className="text-sm opacity-90">@myu_rararara</p>
                    <p className="text-xs opacity-75 mt-1">DMまたはリプライでお声がけください</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* よくある質問 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">よくある質問</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <p className="font-medium text-gray-900 mb-2">Q. 取引でトラブルが発生しました</p>
                  <p className="text-gray-600">A. メール（info@textmatch.info）またはSNSのDMで詳細をお知らせください。迅速に対応いたします。</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="font-medium text-gray-900 mb-2">Q. 新機能の要望があります</p>
                  <p className="text-gray-600">A. メールまたはSNSのDMでお気軽にご要望をお聞かせください。検討させていただきます。</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Q. 教科書の出品方法がわかりません</p>
                  <p className="text-gray-600">A. ヘッダーの「教科書を出品」から簡単に出品できます。不明な点はお気軽にご連絡ください。</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}