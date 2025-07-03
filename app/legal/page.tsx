"use client"

import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LegalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">特定商取引法に基づく表記</h1>
          
          <div className="space-y-6">
            {/* 販売業者 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">販売事業者名</CardTitle>
              </CardHeader>
              <CardContent>
                <p>村井雅斗(個人事業主)</p>
              </CardContent>
            </Card>

            {/* 所在地 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">所在地</CardTitle>
              </CardHeader>
              <CardContent>
                <p>千葉県(請求があった場合詳細を遅滞なく開示します)</p>
              </CardContent>
            </Card>

            {/* 連絡先 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">連絡先</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>電話番号：</strong>請求があった場合遅滞なく開示します</p>
                  <p><strong>メールアドレス：</strong>info@textmatch.info</p>
                  <p className="text-sm text-muted-foreground">
                    ※お問い合わせは上記メールアドレスもしくはお問い合わせフォームからお願いいたします
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 運営責任者 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">運営統括責任者</CardTitle>
              </CardHeader>
              <CardContent>
                <p>村井雅斗</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">販売価格</CardTitle>
              </CardHeader>
              <CardContent>
                <p>各商品ページに税込価格を表示しています。</p>
              </CardContent>
            </Card>


            {/* 追加手数料等の追加料金 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">追加手数料等の追加料金</CardTitle>
              </CardHeader>
              <CardContent>
                <p>商品の代金には、手数料などを含みます。追加費用は発生しません。</p>
                <p>当サービスは、販売額の10%をサービス手数料として出品者から徴収します。</p>
              </CardContent>
            </Card>

            {/* 支払方法 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">支払方法</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>クレジットカード決済（Stripe）など</p>
                  <p>支払時期：購入手続き完了時に即時決済されます。</p>
                </div>
              </CardContent>
            </Card>

            {/* 商品の引渡し時期 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">商品の引渡し時期</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>出品者と購入者の間で直接決定</p>
                  <p className="text-sm text-muted-foreground">
                    一般的な引渡し方法：
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>大学構内での手渡し</li>
                    <li>指定場所での受渡し</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 返品・キャンセル */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">返品・キャンセルについて</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">返品・キャンセルの可否</h4>
                    <p className="text-sm text-muted-foreground">
                      原則として商品の性質上、返品・返金はお受けしておりません。
                      商品に重大な欠陥がある場合は、出品者にご連絡の上ご対応ください。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 免責事項 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">免責事項</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    本サービスは個人間取引の仲介プラットフォームです。
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>商品の品質・内容について、運営者は一切の責任を負いません</li>
                    <li>取引に関するトラブルは当事者間で解決してください</li>
                    <li>決済・引渡に関する問題について、運営者は責任を負いません</li>
                    <li>利用者同士の金銭トラブルについて、運営者は責任を負いません</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 個人情報の取扱い */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">個人情報の取扱い</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    お客様の個人情報は、以下の目的で利用いたします：
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>サービス提供のため</li>
                    <li>取引の仲介・サポートのため</li>
                    <li>サービス改善のため</li>
                    <li>重要なお知らせの配信のため</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    詳細については、プライバシーポリシーをご確認ください。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">動作環境</CardTitle>
              </CardHeader>
              <CardContent>
                <p>本サービスは最新のGoogle Chrome, Safari, Firefox等のブラウザに対応しています。</p>
              </CardContent>
            </Card>

            {/* その他 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">その他</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    本表記は、特定商取引法第11条に基づいて作成されています。
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ご不明な点がございましたら、上記連絡先までお問い合わせください。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 更新日 */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            最終更新日：2025年7月2日
          </div>
        </div>
      </main>
    </div>
  )
}