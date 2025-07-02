import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>

      <p className="mb-4">
        TextMatch（以下「本サービス」）は、ユーザーの個人情報の保護に最大限の注意を払います。本プライバシーポリシーは、当サービスにおける個人情報の取り扱いについて定めたものです。
      </p>

      <Section title="1. 適用範囲">
        本ポリシーは、ユーザーが本サービスを利用する際に適用されます。
      </Section>

      <Section title="2. 取得する情報">
        本サービスでは、以下の個人情報を取得します。
        <ul className="list-disc list-inside mt-2">
          <li>メールアドレス</li>
          <li>本名</li>
          <li>表示名（ニックネーム）</li>
          <li>大学名</li>
          <li>学年</li>
          <li>チャット機能での送信内容</li>
        </ul>
      </Section>

      <Section title="3. 取得方法">
        本サービスでは、Firebase Authentication等を通じてユーザー登録時に情報を取得します。GoogleやSNS等の外部ログイン認証も利用する場合があります。
      </Section>

      <Section title="4. 利用目的">
        取得した個人情報は以下の目的に使用します。
        <ul className="list-disc list-inside mt-2">
          <li>教科書売買マッチングサービスの提供</li>
          <li>ユーザー間の連絡・本人確認</li>
          <li>お問い合わせ対応</li>
          <li>不正行為・トラブル対応</li>
          <li>サービス改善・ユーザー動向分析（Google Analytics等による）</li>
        </ul>
      </Section>

      <Section title="5. クレジットカード情報の取扱い">
        決済はStripeを利用しており、本サービスがクレジットカード情報を保持・処理することはありません。
      </Section>

      <Section title="6. クッキー（Cookie）等の利用">
        ユーザー体験の向上および利用状況の分析のために、CookieやGoogle Analyticsを使用しています。
      </Section>

      <Section title="7. 第三者提供">
        取得した個人情報は、以下の場合を除いて第三者に提供することはありません。
        <ul className="list-disc list-inside mt-2">
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく開示請求があった場合（裁判所・行政機関等）</li>
        </ul>
      </Section>

      <Section title="8. 情報の管理・修正・削除">
        <ul className="list-disc list-inside mt-2">
          <li>登録情報はユーザー自身によって修正できます。</li>
          <li>アカウント削除については、運営への申請により対応いたします。</li>
        </ul>
      </Section>

      <Section title="9. 未成年の利用について">
        本サービスは大学生を対象としており、高校生以下の未成年者は原則として利用できません。
      </Section>

      <Section title="10. プライバシーポリシーの変更">
        本ポリシーの内容は予告なく改定される場合があります。重要な変更については登録メールアドレス宛に通知いたします。
      </Section>

      <Section title="11. お問い合わせ先">
        個人情報の取扱いに関するご質問は以下の連絡先までお願いいたします。
        <br />
        Email: info@textmatch.info
      </Section>

      <p className="mt-8">制定日：2025年7月1日</p>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}
