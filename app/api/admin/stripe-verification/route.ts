import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe-server'
import { db } from '@/lib/firebaseConfig'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface VerificationResult {
  firestoreTransactions: Array<{
    id: string
    price: number
    paymentIntentId?: string
    transactionStatus: string
    paidAt?: any
  }>
  stripePayments: Array<{
    id: string
    amount: number
    status: string
    created: number
    metadata: any
  }>
  discrepancies: Array<{
    type: 'missing_in_stripe' | 'missing_in_firestore' | 'amount_mismatch' | 'status_mismatch'
    firestoreId?: string
    stripeId?: string
    details: string
  }>
  summary: {
    firestoreTotal: number
    stripeTotal: number
    firestoreCount: number
    stripeCount: number
    discrepancyCount: number
  }
}

export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック（ここでは簡単な認証のみ）
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Stripe Verification] 開始')

    // 1. Firestoreから決済済み取引を取得
    const firestoreQuery = query(
      collection(db, "books"),
      where("transactionStatus", "in", ["paid", "completed"])
    )
    const firestoreSnapshot = await getDocs(firestoreQuery)
    
    const firestoreTransactions = firestoreSnapshot.docs.map(doc => ({
      id: doc.id,
      price: doc.data().price || 0,
      paymentIntentId: doc.data().paymentIntentId,
      transactionStatus: doc.data().transactionStatus,
      paidAt: doc.data().paidAt
    }))

    console.log(`[Stripe Verification] Firestore取引数: ${firestoreTransactions.length}`)

    // 2. Stripeから決済データを取得（過去30日間）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const created = Math.floor(thirtyDaysAgo.getTime() / 1000)

    const stripePayments = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: created },
      expand: ['data.charges']
    })

    const stripePaymentData = stripePayments.data
      .filter(payment => payment.status === 'succeeded')
      .map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        created: payment.created,
        metadata: payment.metadata
      }))

    console.log(`[Stripe Verification] Stripe決済数: ${stripePaymentData.length}`)

    // 3. 照合処理
    const discrepancies: VerificationResult['discrepancies'] = []
    let firestoreTotal = 0
    let stripeTotal = 0

    // Firestoreの各取引をStripeと照合
    for (const fsTransaction of firestoreTransactions) {
      firestoreTotal += fsTransaction.price

      if (fsTransaction.paymentIntentId) {
        const stripePayment = stripePaymentData.find(sp => sp.id === fsTransaction.paymentIntentId)
        
        if (!stripePayment) {
          discrepancies.push({
            type: 'missing_in_stripe',
            firestoreId: fsTransaction.id,
            stripeId: fsTransaction.paymentIntentId,
            details: `Firestore取引 ${fsTransaction.id} に対応するStripe決済 ${fsTransaction.paymentIntentId} が見つかりません`
          })
        } else {
          // 金額照合（StripeはcentS単位、Firestoreは円単位）
          const stripeAmountInYen = Math.round(stripePayment.amount / 100)
          if (stripeAmountInYen !== fsTransaction.price) {
            discrepancies.push({
              type: 'amount_mismatch',
              firestoreId: fsTransaction.id,
              stripeId: stripePayment.id,
              details: `金額不一致: Firestore ¥${fsTransaction.price} vs Stripe ¥${stripeAmountInYen}`
            })
          }
        }
      } else {
        // paymentIntentIdがないが決済済みになっている取引
        if (fsTransaction.transactionStatus === 'paid') {
          discrepancies.push({
            type: 'missing_in_stripe',
            firestoreId: fsTransaction.id,
            details: `PaymentIntentIDがないのに決済済みステータス: ${fsTransaction.id}`
          })
        }
      }
    }

    // Stripeにあるがfirestoreにない決済を確認
    for (const stripePayment of stripePaymentData) {
      stripeTotal += Math.round(stripePayment.amount / 100)
      
      const textbookId = stripePayment.metadata?.textbook_id
      if (textbookId) {
        const fsTransaction = firestoreTransactions.find(fs => fs.id === textbookId)
        if (!fsTransaction) {
          discrepancies.push({
            type: 'missing_in_firestore',
            stripeId: stripePayment.id,
            details: `Stripe決済 ${stripePayment.id} に対応するFirestore取引が見つかりません (textbook_id: ${textbookId})`
          })
        }
      }
    }

    const result: VerificationResult = {
      firestoreTransactions,
      stripePayments: stripePaymentData,
      discrepancies,
      summary: {
        firestoreTotal,
        stripeTotal,
        firestoreCount: firestoreTransactions.length,
        stripeCount: stripePaymentData.length,
        discrepancyCount: discrepancies.length
      }
    }

    console.log(`[Stripe Verification] 完了 - 不整合: ${discrepancies.length}件`)
    console.log(`[Stripe Verification] Firestore合計: ¥${firestoreTotal.toLocaleString()}`)
    console.log(`[Stripe Verification] Stripe合計: ¥${stripeTotal.toLocaleString()}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('[Stripe Verification] エラー:', error)
    return NextResponse.json(
      { error: 'Stripe verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}