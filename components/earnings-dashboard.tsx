"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Clock, CreditCard, ExternalLink } from "lucide-react"

interface EarningsData {
  totalRevenue: number
  availableBalance: number
  pendingBalance: number
  totalPayouts: number
  currency: string
}

interface EarningsDashboardProps {
  stripeAccountId: string
}

export default function EarningsDashboard({ stripeAccountId }: EarningsDashboardProps) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(false)

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!stripeAccountId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/stripe/balance?account_id=${stripeAccountId}`)
        
        if (!response.ok) {
          throw new Error('売上情報の取得に失敗しました')
        }

        const data = await response.json()
        setEarnings(data)
        setError(null)
      } catch (err) {
        console.error('Earnings fetch error:', err)
        setError(err instanceof Error ? err.message : '売上情報の取得中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [stripeAccountId])

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  const handlePayoutClick = async () => {
    if (!stripeAccountId) return
    
    setPayoutLoading(true)
    try {
      const response = await fetch('/api/stripe/payout-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: stripeAccountId
        }),
      })

      if (!response.ok) {
        throw new Error('出金リンクの取得に失敗しました')
      }

      const data = await response.json()
      window.open(data.url, '_blank')
    } catch (err) {
      console.error('Payout link error:', err)
      alert('出金ページの取得中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setPayoutLoading(false)
    }
  }

  if (!stripeAccountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            売上情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Stripe Connectの設定を完了すると売上情報が表示されます
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            売上情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            売上情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!earnings) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            売上情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 総売上 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-muted-foreground">総売上</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(earnings.totalRevenue)}
              </p>
            </div>

            {/* 出金可能残高 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">出金可能残高</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(earnings.availableBalance)}
              </p>
            </div>

            {/* 保留中残高 */}
            {earnings.pendingBalance > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">保留中残高</span>
                </div>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(earnings.pendingBalance)}
                </p>
              </div>
            )}

            {/* 総出金額 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-muted-foreground">総出金額</span>
              </div>
              <p className="text-xl font-semibold text-gray-600">
                {formatCurrency(earnings.totalPayouts)}
              </p>
            </div>
          </div>

          {/* Stripeダッシュボードリンクと注意事項 */}
          <div className="mt-6 space-y-4">
            <div className="flex justify-center">
              <Button 
                onClick={handlePayoutClick}
                disabled={payoutLoading}
                className="flex items-center gap-2"
                variant="default"
              >
                <ExternalLink className="h-4 w-4" />
                {payoutLoading ? '読み込み中...' : 'Stripeダッシュボードを開く'}
              </Button>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Stripeダッシュボードについて：</strong> 上のボタンから自分のStripeアカウントにアクセスできます。
                出金、取引履歴の確認、アカウント設定の変更などが行えます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}