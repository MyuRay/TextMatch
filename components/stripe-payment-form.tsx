'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  textbookTitle: string;
  onSuccess: () => void;
}

function CheckoutForm({ amount, textbookTitle, onSuccess }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'エラーが発生しました');
      } else {
        setMessage('予期しないエラーが発生しました');
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setMessage('決済の処理に問題が発生しました');
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>決済情報</CardTitle>
        <p className="text-sm text-gray-600">
          {textbookTitle} - ¥{amount.toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <PaymentElement className="mb-4" />
          {message && (
            <div className="text-red-600 text-sm mb-4">{message}</div>
          )}
          <Button 
            type="submit" 
            disabled={!stripe || isLoading}
            className="w-full"
          >
            {isLoading ? '処理中...' : `¥${amount.toLocaleString()}で購入`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function StripePaymentForm({ clientSecret, amount, textbookTitle, onSuccess }: PaymentFormProps) {
  if (!stripePromise) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-red-600 mb-2">決済システムエラー</h3>
          <p className="text-sm text-gray-600 mb-4">
            Stripeの設定が完了していません。<br />
            管理者にお問い合わせください。
          </p>
          <p className="text-xs text-gray-500">
            環境変数: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY が設定されていません
          </p>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm 
        amount={amount} 
        textbookTitle={textbookTitle} 
        onSuccess={onSuccess}
      />
    </Elements>
  );
}