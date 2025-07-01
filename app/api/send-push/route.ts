import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { getUserFCMToken } from "@/lib/fcm"

// Firebase Admin SDKの初期化（既に初期化されている場合はスキップ）
if (!admin.apps.length) {
  try {
    let serviceAccount

    // 環境変数の存在をデバッグ
    console.log("🔍 環境変数確認:", {
      FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
      FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      NODE_ENV: process.env.NODE_ENV
    })

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      // Base64エンコードされたJSONファイルが環境変数に設定されている場合
      console.log("📋 Base64からサービスアカウント復元中...")
      const decodedJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8')
      serviceAccount = JSON.parse(decodedJson)
      console.log("✅ Base64デコード完了:", { projectId: serviceAccount.project_id })
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // JSONファイル全体が環境変数に設定されている場合
      console.log("📋 JSON形式のサービスアカウント使用中...")
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // 個別の環境変数が設定されている場合
      console.log("📋 個別環境変数からサービスアカウント構成中...")
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || "unitext-8181a",
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      }
    } else {
      console.error("❌ 利用可能な認証情報がありません")
      throw new Error("Firebase Admin SDK の認証情報が設定されていません")
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    })
    
    console.log("✅ Firebase Admin SDK 初期化完了")
  } catch (error) {
    console.error("❌ Firebase Admin初期化エラー:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipientId, title, body, data } = await request.json()

    if (!recipientId || !title || !body) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      )
    }

    // 受信者のFCMトークンを取得
    const fcmToken = await getUserFCMToken(recipientId)
    
    if (!fcmToken) {
      console.log(`ユーザー ${recipientId} のFCMトークンが見つかりません`)
      return NextResponse.json(
        { error: "FCMトークンが見つかりません" },
        { status: 404 }
      )
    }

    // プッシュ通知メッセージを構築
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: data?.actionUrl || "/notifications"
        },
        notification: {
          title,
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          requireInteraction: true,
          actions: [
            {
              action: "open",
              title: "開く"
            },
            {
              action: "close",
              title: "閉じる"
            }
          ]
        }
      }
    }

    // Firebase Admin SDKでプッシュ通知を送信
    const response = await admin.messaging().send(message)
    
    console.log("プッシュ通知送信成功:", response)
    
    return NextResponse.json({
      success: true,
      messageId: response
    })

  } catch (error) {
    console.error("プッシュ通知送信エラー:", error)
    
    return NextResponse.json(
      { 
        error: "プッシュ通知の送信に失敗しました",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// OPTIONSリクエストへの対応（CORS）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}