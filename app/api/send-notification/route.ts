import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFCMToken } from '@/lib/firestore';

if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: "unitext-8181a",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
}

export async function POST(request: NextRequest) {
  try {
    const { recipientId, title, body, data } = await request.json();

    if (!recipientId || !title || !body) {
      return NextResponse.json(
        { error: 'recipientId, title, body are required' },
        { status: 400 }
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