import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/mypage?error=missing_account`);
    }

    const accountLinks = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/mypage?stripe_setup=success&account_id=${accountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.redirect(accountLinks.url);
  } catch (error) {
    console.error('Stripe Connect refresh error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/mypage?error=refresh_failed`);
  }
}