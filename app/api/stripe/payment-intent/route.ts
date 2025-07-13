import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'jpy', connectedAccountId, textbookId, buyerId } = await request.json();

    // Stripe Connectアカウントの状態を確認
    const account = await stripe.accounts.retrieve(connectedAccountId);
    
    // アカウントが設定完了していない場合はエラー
    if (!account.details_submitted || !account.charges_enabled) {
      console.error('Stripe Connectアカウントが未完了:', {
        account_id: connectedAccountId,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled
      });
      return NextResponse.json(
        { error: 'Stripe Connectアカウントの設定が完了していません' },
        { status: 400 }
      );
    }

    const applicationFeeAmount = Math.round(amount * 0.1);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata: {
        textbook_id: textbookId,
        buyer_id: buyerId,
      },
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}