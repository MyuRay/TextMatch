import { loadStripe } from '@stripe/stripe-js';

// クライアントサイド用のStripe初期化
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is not set');
  console.warn('Stripe client-side functionality will not work without publishable key');
}

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;