import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, type = 'express' } = await request.json();

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'JP',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      settings: {
        payouts: {
          schedule: {
            interval: 'manual',
          },
        },
      },
    });

    const accountLinks = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/refresh?account_id=${account.id}`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/mypage?stripe_setup=success&account_id=${account.id}`,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return NextResponse.json({
      account_id: account.id,
      onboarding_url: accountLinks.url,
    });
  } catch (error) {
    console.error('Stripe Connect account creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const account = await stripe.accounts.retrieve(accountId);

    return NextResponse.json({
      account_id: account.id,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error('Stripe Connect account retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account information' },
      { status: 500 }
    );
  }
}