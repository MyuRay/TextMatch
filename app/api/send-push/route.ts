import { NextRequest, NextResponse } from "next/server"
import { getUserFCMToken } from "@/lib/fcm"

export async function POST(request: NextRequest) {
  try {
    const { recipientId, title, body, data } = await request.json()

    if (!recipientId || !title || !body) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      )
    }

    // 環境変数チェック
    const hasFirebaseCredentials = !!(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
    )

    if (!hasFirebaseCredentials) {
      console.error("Firebase Admin SDK の認証情報が設定されていません")
      return NextResponse.json(
        { error: "プッシュ通知サービスが利用できません" },
        { status: 503 }
      )
    }

    // Firebase Admin SDK を動的にインポート・初期化
    const admin = require("firebase-admin")
    
    if (!admin.apps.length) {
      let serviceAccount

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
        const decodedJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8')
        serviceAccount = JSON.parse(decodedJson)
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID || "unitext-8181a",
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      })
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