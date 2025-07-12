import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebaseConfig';
import { doc, updateDoc, serverTimestamp, getDoc, collection, addDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // メタデータから教科書IDと購入者IDを取得
        const textbookId = paymentIntent.metadata?.textbook_id;
        const buyerId = paymentIntent.metadata?.buyer_id;
        
        if (textbookId && buyerId) {
          try {
            // 教科書の取引状態をpaidに更新
            const textbookRef = doc(db, "books", textbookId);
            await updateDoc(textbookRef, {
              transactionStatus: 'paid',
              paidAt: serverTimestamp(),
              paymentIntentId: paymentIntent.id,
            });
            
            // 決済完了メッセージを送信するため、会話IDを取得
            const textbookDoc = await getDoc(textbookRef);
            if (textbookDoc.exists()) {
              const textbookData = textbookDoc.data();
              // 購入者と売り手の会話を検索して決済完了メッセージを送信
              // この部分は必要に応じて実装
            }
            
            console.log(`教科書 ${textbookId} の決済処理が完了しました`);
          } catch (error) {
            console.error('決済成功時のFirestore更新エラー:', error);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // 決済失敗時の処理（必要に応じて実装）
        const failedTextbookId = failedPayment.metadata?.textbook_id;
        if (failedTextbookId) {
          try {
            const textbookRef = doc(db, "books", failedTextbookId);
            await updateDoc(textbookRef, {
              transactionStatus: 'payment_failed',
              paymentFailedAt: serverTimestamp(),
            });
          } catch (error) {
            console.error('決済失敗時のFirestore更新エラー:', error);
          }
        }
        break;

      case 'account.updated':
        const account = event.data.object;
        console.log('Account updated:', account.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}