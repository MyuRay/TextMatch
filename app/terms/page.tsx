import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">TextMatch 利用規約</h1>

      <p className="mb-4">
        本規約は、TextMatch（以下「本サービス」）を利用するすべてのユーザー（以下「利用者」）に適用されます。ご利用にあたっては、本規約に同意いただいたものとみなします。
      </p>

      <Section title="第1条（適用）">
        本規約は、当サービスの提供条件および利用者との関係を定めるものであり、本サービスの利用に関わる一切の関係に適用されます。
      </Section>

      <Section title="第2条（運営者情報）">
        本サービスは、個人事業主によって運営されています。
        <br />
        販売者情報・所在地・連絡先等は「特定商取引法に基づく表記」ページに記載しています。
      </Section>

      <Section title="第3条（利用対象）">
        本サービスは、日本国内の大学生を主な対象としており、大学で使用された教科書・参考書の売買を支援するために提供されます。
      </Section>

      <Section title="第4条（会員登録）">
        <ol className="list-decimal list-inside">
          <li>本サービスの利用には、利用者登録が必要です。</li>
          <li>登録時の情報は正確かつ最新のものをご提供ください。</li>
          <li>本人確認機能（大学メール認証など）は将来的に導入される場合があります。</li>
        </ol>
      </Section>

      <Section title="第5条（取引内容と責任）">
        <ol className="list-decimal list-inside">
          <li>
            本サービスは、利用者間の個人間取引を仲介するプラットフォームであり、商品の販売者ではありません。
          </li>
          <li>
            商品の品質、内容、発送等に関しては出品者と購入者の間で直接解決するものとし、当サービスは責任を負いません。
          </li>
        </ol>
      </Section>

      <Section title="第6条（出品のルール）">
        以下の条件を満たす場合に限り出品が可能です。
        <ul className="list-disc list-inside">
          <li>公序良俗に反しない教科書・参考書であること</li>
          <li>実際に手元に所有している商品であること</li>
          <li>正確な説明・画像を掲載すること</li>
        </ul>
        電子書籍、違法コピー、著作権を侵害する商品などの出品は禁止します。
      </Section>

      <Section title="第7条（禁止行為）">
        以下の行為を禁止します。違反が確認された場合、アカウント停止・削除の措置を行う場合があります。
        <ul className="list-disc list-inside">
          <li>外部での直接取引への誘導（連絡先の提示など）</li>
          <li>虚偽または誤解を招く内容の出品</li>
          <li>複数アカウントの作成・運用</li>
          <li>本サービスの運営を妨げる行為</li>
          <li>他の利用者への迷惑行為・不正アクセス</li>
          <li>その他、当サービスが不適切と判断する行為</li>
        </ul>
      </Section>

      <Section title="第8条（手数料と支払い）">
        <ol className="list-decimal list-inside">
          <li>出品者は、商品が購入された場合、販売価格の10%をサービス手数料として当サービスに支払うものとします。</li>
          <li>購入者は、購入時点でStripeを通じて支払いを行います。現金手渡し・銀行振込などの直接取引は禁止です。</li>
        </ol>
      </Section>

      <Section title="第9条（チャット機能）">
        <ol className="list-decimal list-inside">
          <li>本サービスには、取引前後の連絡を目的としたチャット機能があります。</li>
          <li>チャット内容はトラブル防止のため運営者によって保存され、必要に応じて確認される場合があります。</li>
        </ol>
      </Section>

      <Section title="第10条（サービスの変更・中断・終了）">
        運営者は、利用者に事前に通知することなく、サービス内容の変更・一時中断・終了を行うことがあります。
      </Section>

      <Section title="第11条（免責事項）">
        <ol className="list-decimal list-inside">
          <li>本サービスの利用に関連して発生したいかなる損害に対しても、運営者は一切の責任を負いません。</li>
          <li>当サービスは、利用者間の取引に関して、商品の品質・適法性・信頼性等を保証しません。</li>
        </ol>
      </Section>

      <Section title="第12条（規約の改定）">
        本規約の内容は、運営者の判断により改定される場合があります。改定後の規約はウェブサイト上での掲載をもって効力を有するものとします。
      </Section>

      <Section title="第13条（準拠法・裁判管轄）">
        本規約は日本法に準拠し、利用者と運営者の間で訴訟の必要が生じた場合は、運営者所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。
      </Section>

      <p className="mt-8">以上</p>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
