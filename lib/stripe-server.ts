import Stripe from 'stripe';

// サーバーサイド専用のStripe初期化
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY environment variable is not set');
  throw new Error('Stripe configuration error: STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
});

export default stripe;