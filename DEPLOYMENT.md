# uniTex デプロイメントガイド

## Vercel デプロイ手順

### 1. GitHubリポジトリの準備
```bash
git add .
git commit -m "テストローンチ準備完了"
git push origin main
```

### 2. Vercelでのデプロイ

1. [Vercel](https://vercel.com) にアクセス
2. GitHubアカウントでログイン
3. "New Project" をクリック
4. uniTexリポジトリを選択
5. "Deploy" をクリック

### 3. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を追加：

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC_BZ8GMrkloaa-kfnFBZA9m3_5FP9AXEg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unitext-8181a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unitext-8181a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unitext-8181a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=516258091843
NEXT_PUBLIC_FIREBASE_APP_ID=1:516258091843:web:035f412a330c36c14bd5f6
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5C71VHNT6M
```

### 4. Firebase設定の確認

1. Firebase Console で認証ドメインを追加
2. Firestoreのセキュリティルールが正しく設定されているか確認

## 実装済み機能

✅ **認証システム**
- ユーザー登録・ログイン
- プロフィール管理

✅ **教科書機能**  
- 教科書出品・一覧表示
- 詳細ページ・検索機能
- 取引状態管理（販売中/予約済/売切）

✅ **メッセージ機能**
- リアルタイムチャット
- 会話一覧・管理

✅ **お気に入り機能**
- お気に入り追加・削除
- マイページでの一覧表示

✅ **PayPay決済システム（デモ版）**
- 決済UI・フロー
- 取引状態自動更新

## テスト項目

- [ ] ユーザー登録・ログイン
- [ ] 教科書出品・検索
- [ ] メッセージ送受信
- [ ] お気に入り追加・削除
- [ ] PayPay決済フロー（デモ）

## 本番運用前のタスク

- [ ] PayPay実決済API統合
- [ ] 画像ストレージ最適化
- [ ] パフォーマンス監視設定
- [ ] ログ監視・エラートラッキング
- [ ] バックアップ戦略