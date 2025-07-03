import { NextRequest, NextResponse } from "next/server"

/**
 * ユーザー一覧を取得（管理者用）
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: 認証チェック
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const university = searchParams.get("university") || ""
    const status = searchParams.get("status") || ""

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
        const { getUsersClient } = await import("@/lib/adminFirestore")
        const result = await getUsersClient({
          page,
          limit,
          search,
          university,
          status
        })
        return NextResponse.json(result)
      } catch (clientError) {
        console.error("クライアント側Firestore取得エラー:", clientError)
        return NextResponse.json({
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        })
      }
    }
    let query = db.collection("users")

    // 検索条件を適用
    if (university) {
      query = query.where("university", "==", university)
    }

    if (status) {
      query = query.where("status", "==", status)
    }

    // 並び順とページネーション
    query = query.orderBy("createdAt", "desc")
    
    const snapshot = await query.get()
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // 機密情報は除外
      password: undefined,
    }))

    // 検索フィルタリング（名前・メール）
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.nickname?.toLowerCase().includes(searchLower)
      )
    }

    // 総数を計算
    const total = users.length

    // ページネーション適用
    const offset = (page - 1) * limit
    users = users.slice(offset, offset + limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error("ユーザー一覧取得エラー:", error)
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}