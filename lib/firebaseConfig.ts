// lib/firebaseConfig.ts
import { initializeApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// デバッグ用: 環境変数の確認
console.log('Firebase Config:', firebaseConfig)

const app = initializeApp(firebaseConfig)

// Firestoreの初期化にエラーハンドリングを追加
export const db = (() => {
  try {
    const firestore = getFirestore(app)
    
    // 開発環境でのみエミュレータ接続を試行
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      try {
        // エミュレータが利用可能な場合のみ接続
        // connectFirestoreEmulator(firestore, 'localhost', 8080)
        console.log('🔥 Firestore: 本番環境に接続')
      } catch (emulatorError) {
        console.log('🔥 Firestore: エミュレータ接続をスキップ')
      }
    }
    
    return firestore
  } catch (error) {
    console.error('🔥 Firestore初期化エラー:', error)
    throw error
  }
})()

export const auth = getAuth(app)
export { app }
