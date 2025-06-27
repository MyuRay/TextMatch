import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFCMToken } from '@/lib/firestore';

// Firebase Admin初期化（必要な環境変数がある場合のみ）
if (!admin.apps.length) {
  const requiredEnvVars = [
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_CLIENT_X509_CERT_URL'
  ];

  const allEnvVarsPresent = requiredEnvVars.every(varName => process.env[varName]);

  if (allEnvVarsPresent) {
    try {
      const serviceAccount = {
        type: "service_account",
        project_id: "unitext-8181a",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: "unitext-8181a"
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Firebase Admin SDK initialization failed:', error);
    }
  } else {
    console.log('Firebase Admin SDK環境変数が不足しています - 通知機能は無効です');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Firebase Adminが初期化されていない場合
    if (!admin.apps.length) {
      console.log('Firebase Admin未初期化 - 通知スキップ');
      return NextResponse.json(
        { success: true, message: 'Notification skipped - Firebase Admin not initialized' },
        { status: 200 }
      );
    }

    const { recipientId, title, body, data } = await request.json();

    if (!recipientId || !title || !body) {
      return NextResponse.json(
        { error: 'recipientId, title, body are required' },
        { status: 400 }
      );
    }

    // Firebase Messagingが利用可能かチェック
    try {
      admin.messaging();
    } catch (messagingError) {
      console.log('Firebase Messaging未初期化 - 通知スキップ');
      return NextResponse.json(
        { success: true, message: 'Notification skipped - Firebase Messaging not available' },
        { status: 200 }
      );
    }

    const token = await getFCMToken(recipientId);
    
    if (!token) {
      console.log('FCMトークンが見つかりません:', recipientId);
      return NextResponse.json(
        { error: 'FCM token not found for user' },
        { status: 404 }
      );
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token
    };

    const response = await admin.messaging().send(message);
    console.log('通知送信成功:', response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error('通知送信エラー:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}