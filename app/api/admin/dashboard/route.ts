import { NextRequest, NextResponse } from "next/server"

/**
 * 管理ダッシュボード統計データを取得
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: 管理者認証チェック
    
    // Firebase Admin SDKの動的インポート
    let db
    try {
      await import("@/lib/firebaseAdmin")
      const { getFirestore } = await import("firebase-admin/firestore")
      db = getFirestore()
    } catch (adminError) {
      console.warn("Firebase Admin SDK利用不可、クライアント側Firestoreにフォールバック")
      
      try {
        // クライアント側Firestoreを使用
        const { getDashboardStatsClient } = await import("@/lib/adminFirestore")
        const result = await getDashboardStatsClient()
        return NextResponse.json(result)
      } catch (clientError) {
        console.error("クライアント側Firestore統計取得エラー:", clientError)
        return NextResponse.json({
          stats: {
            totalUsers: 0,
            totalBooks: 0,
            totalTransactions: 0,
            todayRegistrations: 0,
            pendingReports: 0,
            revenue: 0
          },
          recentUsers: []
        })
      }
    }
    
    // 並列でデータを取得
    const [
      usersSnapshot,
      booksSnapshot,
      conversationsSnapshot,
      todayUsersSnapshot
    ] = await Promise.all([
      // 総ユーザー数
      db.collection("users").count().get(),
      
      // 総教科書数
      db.collection("books").count().get(),
      
      // 総取引数（会話数）
      db.collection("conversations").count().get(),
      
      // 今日の新規登録ユーザー（24時間以内）
      db.collection("users")
        .where("createdAt", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000))
        .count()
        .get()
    ])

    // 未処理の通報数を取得（通報機能があれば）
    let pendingReports = 0
    try {
      const reportsSnapshot = await db.collection("reports")
        .where("status", "==", "pending")
        .count()
        .get()
      pendingReports = reportsSnapshot.data().count
    } catch (error) {
      // 通報コレクションがまだ存在しない場合
      console.log("通報コレクションが見つかりません")
    }

    // 売上計算（手数料収入）- 実際の取引データから計算
    let revenue = 0
    try {
      const completedBooksSnapshot = await db.collection("books")
        .where("status", "==", "sold")
        .where("transactionStatus", "==", "completed")
        .get()
      
      // 手数料を5%と仮定
      revenue = completedBooksSnapshot.docs.reduce((total, doc) => {
        const bookData = doc.data()
        const price = bookData.price || 0
        return total + (price * 0.05) // 5%の手数料
      }, 0)
    } catch (error) {
      console.log("売上計算エラー:", error)
    }

    // 最近の登録ユーザーを取得
    const recentUsersSnapshot = await db.collection("users")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get()
    
    const recentUsers = recentUsersSnapshot.docs.map(doc => {
      const data = doc.data() as any
      return {
        id: doc.id,
        ...data
      }
    })

    const stats = {
      totalUsers: usersSnapshot.data().count,
      totalBooks: booksSnapshot.data().count,
      totalTransactions: conversationsSnapshot.data().count,
      todayRegistrations: todayUsersSnapshot.data().count,
      pendingReports,
      revenue: Math.round(revenue)
    }

    return NextResponse.json({
      stats,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        fullName: user.fullName || null,
        nickname: user.nickname || null,
        university: user.university || null,
        createdAt: user.createdAt || null
      }))
    })

  } catch (error: any) {
    console.error("ダッシュボード統計取得エラー:", error)
    return NextResponse.json(
      { error: "統計データの取得に失敗しました" },
      { status: 500 }
    )
  }
}