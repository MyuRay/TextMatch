"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, Clock } from "lucide-react"
import { updateTextbookStatus } from "@/lib/firestore"

interface PayPayPaymentProps {
  textbook: {
    id: string
    title: string
    price: number
    userId: string
  }
  buyerId: string
  onPaymentSuccess: () => void
  onPaymentCancel: () => void
}

export function PayPayPayment({ textbook, buyerId, onPaymentSuccess, onPaymentCancel }: PayPayPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success'>('confirm')

  const handlePayPayPayment = async () => {
    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // PayPay決済のシミュレーション（実際のAPI統合時は置き換える）
      // PayPay SDKまたはAPIを使用してPayPay決済を開始
      
      // デモ用：2秒後に成功とする
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 教科書の状態を「sold」に更新
      await updateTextbookStatus(textbook.id, 'sold', buyerId)
      
      setPaymentStep('success')
      setTimeout(() => {
        onPaymentSuccess()
      }, 2500)
      
    } catch (error) {
      console.error("PayPay決済エラー:", error)
      alert("決済に失敗しました。もう一度お試しください。")
      setPaymentStep('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  const generatePayPayUrl = () => {
    // 実際のPayPay決済では、PayPay APIを使用してQRコードまたは決済URLを生成
    // ここではデモ用のURL
    const amount = textbook.price || 0
    const merchantId = "demo_merchant"
    const orderId = `order_${textbook.id}_${Date.now()}`
    
    // PayPay実装時は正式なAPIエンドポイントに変更
    return `paypay://payment?merchant=${merchantId}&amount=${amount}&order=${orderId}`
  }

  if (paymentStep === 'processing') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h3 className="text-lg font-semibold">PayPay決済処理中...</h3>
            <p className="text-sm text-muted-foreground">
              PayPayアプリで決済を完了してください
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paymentStep === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-600">決済完了！</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium">{textbook.title}</p>
              <p className="text-lg font-bold text-green-600">¥{textbook.price?.toLocaleString() || '0'}</p>
              <p className="text-sm text-muted-foreground">
                購入ありがとうございます
              </p>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>・ 出品者に連絡して受け渡し方法を確認してください</p>
              <p>・ 取引完了までお待ちください</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          PayPay決済
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 購入商品情報 */}
        <div className="space-y-2">
          <h4 className="font-medium">購入商品</h4>
          <div className="bg-muted p-3 rounded-lg">
            <p className="font-medium">{textbook.title}</p>
            <p className="text-2xl font-bold text-primary">¥{textbook.price?.toLocaleString() || '0'}</p>
          </div>
        </div>

        <Separator />

        {/* PayPay決済の特徴 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span>安全・安心な決済</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>即座に決済完了</span>
          </div>
        </div>

        <Separator />

        {/* 決済方法の説明 */}
        <div className="space-y-2">
          <h4 className="font-medium">決済方法</h4>
          <div className="text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-1">
              <li>「PayPayで支払う」ボタンをタップ</li>
              <li>PayPayアプリで決済を完了</li>
              <li>購入完了</li>
            </ol>
          </div>
        </div>

        {/* 決済ボタン */}
        <div className="space-y-3 pt-4">
          <Button 
            onClick={handlePayPayPayment}
            disabled={isProcessing}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                処理中...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                PayPayで支払う (¥{textbook.price?.toLocaleString() || '0'})
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onPaymentCancel}
            disabled={isProcessing}
            className="w-full"
          >
            キャンセル
          </Button>
        </div>

        {/* 注意事項 */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <p className="font-medium mb-1">注意事項：</p>
          <ul className="space-y-1">
            <li>• 決済完了後のキャンセルはできません</li>
            <li>• 出品者との受け渡し方法は事前に確認してください</li>
            <li>• トラブル時はサポートまでご連絡ください</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}