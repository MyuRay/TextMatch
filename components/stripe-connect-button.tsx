'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/useAuth';

interface StripeConnectButtonProps {
  onConnected?: (accountId: string) => void;
}

export default function StripeConnectButton({ onConnected }: StripeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleConnect = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('stripe_account_id', data.account_id);
        window.location.href = data.onboarding_url;
      } else {
        console.error('Failed to create Stripe account:', data.error);
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isLoading || !user}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {isLoading ? '処理中...' : 'Stripe Connectで販売を開始'}
    </Button>
  );
}