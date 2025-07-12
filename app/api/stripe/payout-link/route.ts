import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    // Stripe Expressダッシュボードのリンクを作成
    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return NextResponse.json({
      url: loginLink.url
    });

  } catch (error) {
    console.error('Stripe login link creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payout link' },
      { status: 500 }
    );
  }
}