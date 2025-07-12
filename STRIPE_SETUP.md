# Stripe Connect 連携設定

## 必要な環境変数

`.env.local` ファイルに以下の環境変数を追加してください：

```env
# Stripe設定
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Stripe Connect設定手順

### 1. Stripeアカウントの作成・設定

1. [Stripe Dashboard](https://dashboard.stripe.com/)にログイン
2. 左メニューから「Connect」→「設定」を選択
3. 「Express accounts」を有効化
4. アプリケーション名とロゴを設定

### 2. Webhook設定

1. Stripe Dashboardで「開発者」→「Webhooks」を選択
2. 「エンドポイントを追加」をクリック
3. エンドポイントURL: `https://yourdomain.com/api/stripe/webhook`
4. 以下のイベントを選択：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`

### 3. 手数料設定

現在の設定では、プラットフォーム手数料として取引金額の10%を設定しています。
変更する場合は以下のファイルを編集してください：

- `app/api/stripe/payment-intent/route.ts`の`applicationFeeAmount`

## 使用方法

### 販売者（Stripe Connect連携）

1. マーケットプレイスページで「Stripe Connectで販売を開始」ボタンをクリック
2. Stripeのオンボーディングプロセスを完了
3. 連携完了後、出品した教科書の決済が可能になります

### 購入者（決済）

1. 教科書詳細ページで「購入」ボタンをクリック
2. 決済フォームでカード情報を入力
3. 決済完了後、販売者に自動的に送金されます

## 注意事項

- テスト環境では実際の決済は行われません
- 本番環境に移行する際は、環境変数をライブキーに変更してください
- 法的要件に従って利用規約とプライバシーポリシーを更新してください