import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Firebase Admin初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()
const messaging = getMessaging()

export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, textbookTitle, messageContent } = await request.json()

    if (!recipientId || !senderName || !textbookTitle || !messageContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 受信者のFCMトークンを取得
    const userDoc = await db.collection('users').doc(recipientId).get()
    
    if (!userDoc.exists) {
      console.log('ユーザーが見つかりません:', recipientId)
      return NextResponse.json({ success: false, error: 'User not found' })
    }

    const userData = userDoc.data()
    const fcmToken = userData?.fcmToken

    if (!fcmToken) {
      console.log('FCMトークンが見つかりません:', recipientId)
      return NextResponse.json({ success: false, error: 'No FCM token found' })
    }

    // 通知メッセージを作成
    const message = {
      notification: {
        title: `${senderName}さんからメッセージ`,
        body: `${textbookTitle}について: ${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}`,
      },
      data: {
        url: '/messages',
        type: 'message',
        senderId: senderName,
        textbook: textbookTitle,
      },
      token: fcmToken,
    }

    // プッシュ通知を送信
    const response = await messaging.send(message)
    console.log('プッシュ通知送信成功:', response)

    return NextResponse.json({ success: true, messageId: response })
  } catch (error: any) {
    console.error('プッシュ通知送信エラー:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    )
  }
}