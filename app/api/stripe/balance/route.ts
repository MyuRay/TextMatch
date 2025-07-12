import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    // Stripe Connectアカウントのバランスを取得
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    // 出金履歴を取得
    const payouts = await stripe.payouts.list(
      { limit: 100 },
      { stripeAccount: accountId }
    );

    // 総売上を計算（全取引の合計）
    const charges = await stripe.charges.list(
      { limit: 100 },
      { stripeAccount: accountId }
    );

    const totalRevenue = charges.data
      .filter(charge => charge.status === 'succeeded')
      .reduce((sum, charge) => sum + charge.amount, 0);

    // 未出金残高（利用可能残高）
    const availableBalance = balance.available.reduce((sum, bal) => {
      if (bal.currency === 'jpy') {
        return sum + bal.amount;
      }
      return sum;
    }, 0);

    // 保留中残高
    const pendingBalance = balance.pending.reduce((sum, bal) => {
      if (bal.currency === 'jpy') {
        return sum + bal.amount;
      }
      return sum;
    }, 0);

    // 総出金額
    const totalPayouts = payouts.data
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amount, 0);

    return NextResponse.json({
      totalRevenue,           // 総売上
      availableBalance,       // 出金可能残高
      pendingBalance,         // 保留中残高
      totalPayouts,          // 総出金額
      currency: 'jpy'
    });

  } catch (error) {
    console.error('Stripe balance retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve balance information' },
      { status: 500 }
    );
  }
}