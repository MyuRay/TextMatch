/**
 * 管理者用Firestore操作ライブラリ
 * Admin SDKが利用できない場合はクライアント側Firestoreを使用
 */

import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit as firestoreLimit,
  where,
  getCountFromServer
} from "firebase/firestore"
import { db } from "./firebaseConfig"

/**
 * ユーザー一覧を取得（クライアント側Firestore使用）
 */
export async function getUsersClient(params: {
  page: number
  limit: number
  search?: string
  university?: string
  status?: string
}) {
  try {
    console.log("📖 クライアント側Firestoreでユーザー一覧を取得中...")
    
    let q = query(collection(db, "users"), orderBy("createdAt", "desc"))
    
    // 大学フィルター
    if (params.university) {
      q = query(q, where("university", "==", params.university))
    }
    
    // ステータスフィルター
    if (params.status) {
      q = query(q, where("status", "==", params.status))
    }
    
    // データを取得
    const snapshot = await getDocs(q)
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // パスワードなどの機密情報は除外
      password: undefined,
    }))
    
    // 検索フィルタリング
    if (params.search) {
      const searchLower = params.search.toLowerCase()
      users = users.filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.nickname?.toLowerCase().includes(searchLower)
      )
    }
    
    // 総数
    const total = users.length
    
    // ページネーション
    const offset = (params.page - 1) * params.limit
    const paginatedUsers = users.slice(offset, offset + params.limit)
    
    console.log(`✅ ${paginatedUsers.length}件のユーザーを取得しました`)
    
    return {
      users: paginatedUsers,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    }
  } catch (error) {
    console.error("❌ クライアント側ユーザー取得エラー:", error)
    throw error
  }
}

/**
 * ダッシュボード統計を取得（クライアント側Firestore使用）
 */
export async function getDashboardStatsClient() {
  try {
    console.log("📊 クライアント側Firestoreで統計データを取得中...")
    
    // 並列で統計データを取得
    const [usersSnapshot, booksSnapshot, conversationsSnapshot] = await Promise.all([
      getCountFromServer(collection(db, "users")),
      getCountFromServer(collection(db, "books")),
      getCountFromServer(collection(db, "conversations"))
    ])
    
    // 今日の新規登録（24時間以内）
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const todayUsersQuery = query(
      collection(db, "users"),
      where("createdAt", ">=", yesterday)
    )
    const todayUsersSnapshot = await getDocs(todayUsersQuery)
    
    // 最近の登録ユーザー
    const recentUsersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      firestoreLimit(5)
    )
    const recentUsersSnapshot = await getDocs(recentUsersQuery)
    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // 売上計算（売却済み教科書の5%手数料）
    const soldBooksQuery = query(
      collection(db, "books"),
      where("status", "==", "sold")
    )
    const soldBooksSnapshot = await getDocs(soldBooksQuery)
    const revenue = soldBooksSnapshot.docs.reduce((total, doc) => {
      const bookData = doc.data()
      const price = bookData.price || 0
      return total + (price * 0.05) // 5%の手数料
    }, 0)
    
    const stats = {
      totalUsers: usersSnapshot.data().count,
      totalBooks: booksSnapshot.data().count,
      totalTransactions: conversationsSnapshot.data().count,
      todayRegistrations: todayUsersSnapshot.docs.length,
      pendingReports: 0, // 通報機能未実装のため0
      revenue: Math.round(revenue)
    }
    
    console.log("✅ 統計データ取得完了:", stats)
    
    return {
      stats,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        fullName: user.fullName,
        nickname: user.nickname,
        university: user.university,
        createdAt: user.createdAt
      }))
    }
  } catch (error) {
    console.error("❌ クライアント側統計取得エラー:", error)
    throw error
  }
}