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
    <Card className="w-full mx-auto border-0 shadow-none">
      <CardHeader className="pb-3 px-0">
        <CardTitle className="text-base sm:text-lg">決済情報</CardTitle>
        <div className="text-sm text-gray-600">
          <p className="line-clamp-2 break-words mb-1 text-xs sm:text-sm">
            {textbookTitle}
          </p>
          <p className="font-medium text-base sm:text-lg text-gray-900">
            ¥{amount.toLocaleString()}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-0">
        <div className="text-amber-600 text-sm p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="font-medium text-xs">⚠️ ご注意：JCBカードはご利用いただけません</p>
          <p className="text-xs mt-1">VISA、Mastercard、American Expressのみ対応しております</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="min-h-[100px] sm:min-h-[120px]">
            <PaymentElement 
              className="w-full" 
              options={{
                layout: {
                  type: 'accordion',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: false
                }
              }}
            />
          </div>
          {message && (
            <div className="text-red-600 text-sm p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200 break-words">
              {message}
            </div>
          )}
          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={!stripe || isLoading}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium"
            >
              {isLoading ? '処理中...' : `¥${amount.toLocaleString()}で購入`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function StripePaymentForm({ clientSecret, amount, textbookTitle, onSuccess }: PaymentFormProps) {
  if (!stripePromise) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-4 sm:p-6 text-center">
          <h3 className="font-semibold text-red-600 mb-2 text-sm sm:text-base">決済システムエラー</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 break-words">
            Stripeの設定が完了していません。<br />
            管理者にお問い合わせください。
          </p>
          <p className="text-xs text-gray-500 break-words">
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
      variables: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSizeBase: '14px',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
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