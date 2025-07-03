import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Firebase Admin SDKの初期化
if (!getApps().length) {
  try {
    // 環境変数からサービスアカウントキーを取得
    let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
    
    // Base64エンコードされたキーがある場合はデコード
    if (!serviceAccountKey && serviceAccountKeyBase64) {
      try {
        serviceAccountKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8')
        console.log('🔓 Base64エンコードされたサービスアカウントキーをデコードしました')
      } catch (decodeError) {
        console.error('❌ Base64デコードエラー:', decodeError)
      }
    }
    
    if (!serviceAccountKey) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY環境変数が設定されていません')
      console.warn('管理者機能は制限されます')
    } else {
      const serviceAccount = JSON.parse(serviceAccountKey)
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      })
      
      console.log('✅ Firebase Admin SDK初期化完了')
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK初期化エラー:', error)
    console.warn('フォールバック: クライアント側Firebaseを使用します')
  }
}