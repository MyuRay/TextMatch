import { NextRequest, NextResponse } from "next/server"

/**
 * 個別ユーザーの操作（管理者用）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // TODO: 管理者認証チェック
    
    const { action } = await request.json()
    const { userId } = params

    // Firebase Admin SDKの動的インポート
    let db
    try {
      await import("@/lib/firebaseAdmin")
      const { getFirestore } = await import("firebase-admin/firestore")
      db = getFirestore()
    } catch (adminError) {
      console.warn("Firebase Admin SDK利用不可")
      return NextResponse.json(
        { error: "管理者機能は現在利用できません" },
        { status: 503 }
      )
    }
    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    switch (action) {
      case 'suspend':
        await userRef.update({
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedBy: 'admin' // TODO: 実際の管理者IDを記録
        })
        break

      case 'activate':
        await userRef.update({
          status: 'active',
          suspendedAt: null,
          suspendedBy: null
        })
        break

      case 'ban':
        await userRef.update({
          status: 'banned',
          bannedAt: new Date(),
          bannedBy: 'admin' // TODO: 実際の管理者IDを記録
        })
        break

      case 'make_official':
        await userRef.update({
          isOfficial: true,
          officialType: 'admin'
        })
        break

      case 'remove_official':
        await userRef.update({
          isOfficial: false,
          officialType: null
        })
        break

      default:
        return NextResponse.json(
          { error: "無効なアクションです" },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("ユーザー操作エラー:", error)
    return NextResponse.json(
      { error: "操作に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 個別ユーザーの詳細情報取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // TODO: 管理者認証チェック
    
    const { userId } = params
    
    // Firebase Admin SDKの動的インポート
    let db
    try {
      await import("@/lib/firebaseAdmin")
      const { getFirestore } = await import("firebase-admin/firestore")
      db = getFirestore()
    } catch (adminError) {
      console.warn("Firebase Admin SDK利用不可")
      return NextResponse.json(
        { error: "管理者機能は現在利用できません" },
        { status: 503 }
      )
    }
    
    // ユーザー基本情報
    const userDoc = await db.collection("users").doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    const userData = { id: userDoc.id, ...userDoc.data() }

    // ユーザーの教科書データ
    const booksSnapshot = await db.collection("books")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get()
    
    const books = booksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // ユーザーの取引履歴
    const transactionsSnapshot = await db.collection("conversations")
      .where("buyerId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get()
    
    const buyTransactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'buy'
    }))

    const sellTransactionsSnapshot = await db.collection("conversations")
      .where("sellerId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get()
    
    const sellTransactions = sellTransactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'sell'
    }))

    const transactions = [...buyTransactions, ...sellTransactions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)

    return NextResponse.json({
      user: userData,
      stats: {
        totalBooks: books.length,
        totalTransactions: transactions.length,
        activeBooks: books.filter(book => book.status === 'available').length,
        soldBooks: books.filter(book => book.status === 'sold').length
      },
      books,
      transactions
    })

  } catch (error: any) {
    console.error("ユーザー詳細取得エラー:", error)
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    )
  }
}