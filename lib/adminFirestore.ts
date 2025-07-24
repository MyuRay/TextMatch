/**
 * 管理者用Firestoreデータ取得・操作関数
 */

import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
  Timestamp,
  QueryDocumentSnapshot
} from "firebase/firestore"
import { db } from "./firebaseConfig"
import { UserProfile } from "./firestore"

export interface AdminUserProfile extends UserProfile {
  id: string
  lastLoginAt?: Timestamp
  accountStatus: 'active' | 'suspended' | 'deleted'
  createdBooksCount?: number
  completedTransactionsCount?: number
  statusReason?: string
}

/**
 * ユーザー一覧を取得（ページネーション対応）
 */
export async function getUsers(
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
  filters?: {
    search?: string
    accountStatus?: 'active' | 'suspended' | 'deleted'
    isOfficial?: boolean
  }
): Promise<{ users: AdminUserProfile[], lastDoc?: QueryDocumentSnapshot }> {
  try {
    let q = query(collection(db, "users"), orderBy("createdAt", "desc"))
    
    // フィルタ適用
    if (filters?.accountStatus) {
      q = query(q, where("accountStatus", "==", filters.accountStatus))
    }
    
    if (filters?.isOfficial !== undefined) {
      q = query(q, where("isOfficial", "==", filters.isOfficial))
    }
    
    // ページネーション
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    q = query(q, limit(pageSize))
    
    const snapshot = await getDocs(q)
    const users: AdminUserProfile[] = []
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as UserProfile
      
      // 検索フィルタ（クライアントサイド）
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          data.fullName,
          data.nickname,
          data.email,
          data.university
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          continue
        }
      }
      
      users.push({
        id: docSnap.id,
        ...data,
        accountStatus: (data as any).accountStatus || 'active' // デフォルトはactive
      } as AdminUserProfile)
    }
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    return {
      users,
      lastDoc: newLastDoc
    }
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error)
    throw error
  }
}

/**
 * ユーザーのアカウント状態を更新
 */
export async function updateUserAccountStatus(
  userId: string, 
  status: 'active' | 'suspended' | 'deleted',
  reason?: string
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      accountStatus: status,
      lastModifiedAt: Timestamp.now(),
      ...(reason && { statusReason: reason })
    })
    
    console.log(`ユーザー ${userId} のステータスを ${status} に更新しました`)
  } catch (error) {
    console.error("ユーザーステータス更新エラー:", error)
    throw error
  }
}

/**
 * ユーザーに公式フラグを設定/解除
 */
export async function updateUserOfficialStatus(
  userId: string, 
  isOfficial: boolean,
  officialType?: 'admin' | 'support' | 'team'
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    const updateData: any = {
      isOfficial,
      lastModifiedAt: Timestamp.now()
    }
    
    if (isOfficial && officialType) {
      updateData.officialType = officialType
      updateData.verifiedAt = Timestamp.now()
    } else if (!isOfficial) {
      updateData.officialType = null
      updateData.verifiedAt = null
    }
    
    await updateDoc(userRef, updateData)
    
    console.log(`ユーザー ${userId} の公式ステータスを更新しました`)
  } catch (error) {
    console.error("ユーザー公式ステータス更新エラー:", error)
    throw error
  }
}

/**
 * ユーザーの詳細情報を取得（統計込み）
 */
export async function getUserDetails(userId: string): Promise<AdminUserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    
    if (!userDoc.exists()) {
      return null
    }
    
    const userData = userDoc.data() as UserProfile
    
    // 追加統計情報を取得
    const [booksSnapshot, transactionsSnapshot] = await Promise.all([
      getDocs(query(collection(db, "books"), where("userId", "==", userId))),
      getDocs(query(collection(db, "books"), where("buyerId", "==", userId), where("transactionStatus", "==", "completed")))
    ])
    
    return {
      id: userDoc.id,
      ...userData,
      accountStatus: (userData as any).accountStatus || 'active',
      createdBooksCount: booksSnapshot.size,
      completedTransactionsCount: transactionsSnapshot.size
    } as AdminUserProfile
  } catch (error) {
    console.error("ユーザー詳細取得エラー:", error)
    throw error
  }
}

/**
 * ユーザー統計を取得
 */
export async function getUserStats(): Promise<{
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  officialUsers: number
  recentSignups: number
}> {
  try {
    const [allUsers, suspendedUsers, officialUsers] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(query(collection(db, "users"), where("accountStatus", "==", "suspended"))),
      getDocs(query(collection(db, "users"), where("isOfficial", "==", true)))
    ])
    
    // 過去7日間の新規登録数
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoTimestamp = Timestamp.fromDate(weekAgo)
    
    const recentSignupsSnapshot = await getDocs(
      query(collection(db, "users"), where("createdAt", ">=", weekAgoTimestamp))
    )
    
    return {
      totalUsers: allUsers.size,
      activeUsers: allUsers.size - suspendedUsers.size,
      suspendedUsers: suspendedUsers.size,
      officialUsers: officialUsers.size,
      recentSignups: recentSignupsSnapshot.size
    }
  } catch (error) {
    console.error("ユーザー統計取得エラー:", error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      officialUsers: 0,
      recentSignups: 0
    }
  }
}

/**
 * ダッシュボード統計を取得
 */
export async function getDashboardStats(): Promise<{
  totalUsers: number
  totalBooks: number
  totalMessages: number
  activeTransactions: number
  recentSignups: number
  flaggedContent: number
  totalTransactionAmount: number
  totalRevenue: number
}> {
  try {
    const [
      allUsers,
      allBooks,
      recentSignups
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "books")),
      (() => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoTimestamp = Timestamp.fromDate(weekAgo)
        return getDocs(query(collection(db, "users"), where("createdAt", ">=", weekAgoTimestamp)))
      })()
    ])

    // メッセージ数を計算（全会話の全メッセージ）
    let totalMessages = 0
    try {
      const conversationsSnapshot = await getDocs(collection(db, "conversations"))
      const messagePromises = conversationsSnapshot.docs.map(async (conversationDoc) => {
        const messagesSnapshot = await getDocs(collection(db, "conversations", conversationDoc.id, "messages"))
        return messagesSnapshot.size
      })
      const messageCounts = await Promise.all(messagePromises)
      totalMessages = messageCounts.reduce((sum, count) => sum + count, 0)
    } catch (messageError) {
      console.error("メッセージ数取得エラー:", messageError)
      totalMessages = 0
    }

    // 進行中取引数を計算（支払い済み〜取引完了前）
    let activeTransactions = 0
    try {
      const activeTransactionsSnapshot = await getDocs(
        query(
          collection(db, "books"), 
          where("transactionStatus", "in", ["paid", "in_progress"])
        )
      )
      activeTransactions = activeTransactionsSnapshot.size
    } catch (transactionError) {
      console.error("進行中取引数取得エラー:", transactionError)
      // フォールバック: transactionStatus = "in_progress"のみ
      try {
        const fallbackSnapshot = await getDocs(
          query(collection(db, "books"), where("transactionStatus", "==", "in_progress"))
        )
        activeTransactions = fallbackSnapshot.size
      } catch (fallbackError) {
        console.error("フォールバック取引数取得エラー:", fallbackError)
        activeTransactions = 0
      }
    }

    // 合計取引金額を計算（決済が完了した取引：paid + completed）
    let totalTransactionAmount = 0
    try {
      const paidTransactionsSnapshot = await getDocs(
        query(
          collection(db, "books"), 
          where("transactionStatus", "in", ["paid", "completed"])
        )
      )
      
      console.log(`[Admin Dashboard] 決済完了取引数: ${paidTransactionsSnapshot.size}`)
      
      const transactionDetails: Array<{id: string, price: number, status: string}> = []
      
      paidTransactionsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (typeof data.price === 'number') {
          // 決済が実際に完了した取引のみを対象（paymentIntentIdがある場合は決済済み）
          const hasValidPayment = data.paymentIntentId || data.transactionStatus === 'completed'
          
          if (hasValidPayment) {
            totalTransactionAmount += data.price
            transactionDetails.push({
              id: doc.id,
              price: data.price,
              status: data.transactionStatus || 'unknown'
            })
          } else {
            console.log(`[Admin Dashboard] 決済未確認のため除外: ${doc.id}, status: ${data.transactionStatus}`)
          }
        }
      })
      
      console.log(`[Admin Dashboard] 取引詳細:`, transactionDetails)
      console.log(`[Admin Dashboard] 合計取引金額: ¥${totalTransactionAmount.toLocaleString()}`)
    } catch (amountError) {
      console.error("合計取引金額取得エラー:", amountError)
      totalTransactionAmount = 0
    }
    
    // 合計収益を計算（取引金額の6.4%）
    const totalRevenue = Math.round(totalTransactionAmount * 0.064)
    
    return {
      totalUsers: allUsers.size,
      totalBooks: allBooks.size,
      totalMessages,
      activeTransactions,
      recentSignups: recentSignups.size,
      flaggedContent: 0, // TODO: 実装時に報告/フラグ機能を追加
      totalTransactionAmount,
      totalRevenue
    }
  } catch (error) {
    console.error("ダッシュボード統計取得エラー:", error)
    return {
      totalUsers: 0,
      totalBooks: 0,
      totalMessages: 0,
      activeTransactions: 0,
      recentSignups: 0,
      flaggedContent: 0,
      totalTransactionAmount: 0,
      totalRevenue: 0
    }
  }
}

/**
 * Stripeとの照合結果を取得
 */
export async function verifyWithStripe(): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const response = await fetch('/api/admin/stripe-verification', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer admin-token`, // 実際の認証トークンに置き換え
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Stripe照合エラー:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export interface AdminBookProfile {
  id: string
  title: string
  author: string
  price: number
  condition: string
  description: string
  imageUrl?: string
  status: 'available' | 'reserved' | 'sold'
  transactionStatus?: 'pending' | 'paid' | 'completed'
  userId: string
  sellerName?: string
  sellerEmail?: string
  university?: string
  createdAt: any
  updatedAt?: any
  paidAt?: any
  completedAt?: any
  viewCount?: number
  flaggedCount?: number
  isApproved?: boolean
  adminNotes?: string
  // 追加のFirestore詳細情報
  paymentIntentId?: string
  buyerId?: string
  purchasedAt?: any
  deleteReason?: string
  deletedAt?: any
  statusReason?: string
  category?: string
  isbn?: string
  publisher?: string
  year?: number
}

/**
 * 管理者用：出品一覧を取得（ページネーション対応）
 */
export async function getBooks(
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
  filters?: {
    search?: string
    status?: 'available' | 'reserved' | 'sold'
    transactionStatus?: 'pending' | 'paid' | 'completed'
    isApproved?: boolean
    university?: string
    priceRange?: { min: number; max: number }
  }
): Promise<{ books: AdminBookProfile[], lastDoc?: QueryDocumentSnapshot }> {
  try {
    let q = query(collection(db, "books"), orderBy("createdAt", "desc"))
    
    // フィルタ適用
    if (filters?.status) {
      q = query(q, where("status", "==", filters.status))
    }
    
    if (filters?.transactionStatus) {
      q = query(q, where("transactionStatus", "==", filters.transactionStatus))
    }
    
    if (filters?.isApproved !== undefined) {
      q = query(q, where("isApproved", "==", filters.isApproved))
    }
    
    // ページネーション
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    q = query(q, limit(pageSize))
    
    const snapshot = await getDocs(q)
    const books: AdminBookProfile[] = []
    
    // ユーザー情報を一括取得するためのユーザーIDセット
    const userIds = new Set<string>()
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.userId) userIds.add(data.userId)
    })
    
    // ユーザー情報を一括取得
    const userInfoMap = new Map<string, { name: string, email: string, university: string }>()
    if (userIds.size > 0) {
      const userPromises = Array.from(userIds).map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            return {
              id: userId,
              name: userData.fullName || '不明',
              email: userData.email || '不明',
              university: userData.university || '不明'
            }
          }
        } catch (error) {
          console.error(`ユーザー情報取得エラー (${userId}):`, error)
        }
        return null
      })
      
      const userResults = await Promise.all(userPromises)
      userResults.forEach(result => {
        if (result) {
          userInfoMap.set(result.id, {
            name: result.name,
            email: result.email,
            university: result.university
          })
        }
      })
    }
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const userInfo = userInfoMap.get(data.userId)
      
      // 検索フィルタ（クライアントサイド）
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          data.title,
          data.author,
          data.description,
          userInfo?.name,
          userInfo?.university
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          continue
        }
      }
      
      // 価格範囲フィルタ
      if (filters?.priceRange) {
        const price = data.price || 0
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          continue
        }
      }
      
      // 大学フィルタ
      if (filters?.university && userInfo?.university !== filters.university) {
        continue
      }
      
      books.push({
        id: docSnap.id,
        title: data.title || '不明',
        author: data.author || '不明',
        price: data.price || 0,
        condition: data.condition || '不明',
        description: data.description || '',
        imageUrl: data.imageUrl,
        status: data.status || 'available',
        transactionStatus: data.transactionStatus,
        userId: data.userId,
        sellerName: userInfo?.name,
        sellerEmail: userInfo?.email,
        university: userInfo?.university,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        viewCount: data.viewCount || 0,
        flaggedCount: data.flaggedCount || 0,
        isApproved: data.isApproved !== false, // デフォルトはtrue
        adminNotes: data.adminNotes || ''
      })
    }
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    return {
      books,
      lastDoc: newLastDoc
    }
  } catch (error) {
    console.error("出品一覧取得エラー:", error)
    throw error
  }
}

/**
 * 出品の承認状態を更新
 */
export async function updateBookApprovalStatus(
  bookId: string,
  isApproved: boolean,
  adminNotes?: string
): Promise<void> {
  try {
    const bookRef = doc(db, "books", bookId)
    await updateDoc(bookRef, {
      isApproved,
      adminNotes: adminNotes || '',
      updatedAt: Timestamp.now()
    })
    
    console.log(`出品 ${bookId} の承認状態を ${isApproved ? '承認' : '非承認'} に更新しました`)
  } catch (error) {
    console.error("出品承認状態更新エラー:", error)
    throw error
  }
}

/**
 * 出品を削除（管理者権限）- 物理削除
 */
export async function deleteBook(bookId: string, reason: string, adminUserId?: string): Promise<void> {
  try {
    // 削除前にデータをログ出力（監査用）
    const bookRef = doc(db, "books", bookId)
    const bookDoc = await getDoc(bookRef)
    
    if (bookDoc.exists()) {
      const bookData = bookDoc.data()
      console.log(`[Admin Delete] 出品削除実行:`, {
        bookId,
        title: bookData.title,
        author: bookData.author,
        userId: bookData.userId,
        reason,
        deletedAt: new Date().toISOString(),
        originalData: bookData
      })
      
      // 削除ログを別コレクションに保存（オプション）
      try {
        await addDoc(collection(db, "admin_delete_logs"), {
          bookId,
          bookData,
          deleteReason: reason,
          deletedBy: adminUserId || 'admin',
          deletedAt: Timestamp.now()
        })
      } catch (logError) {
        console.error("削除ログ保存エラー:", logError)
        // ログ保存失敗でも削除は続行
      }
    } else {
      throw new Error(`出品 ${bookId} が見つかりません`)
    }
    
    // 実際にドキュメントを削除
    await deleteDoc(bookRef)
    
    console.log(`出品 ${bookId} を物理削除しました: ${reason}`)
  } catch (error) {
    console.error("出品削除エラー:", error)
    throw error
  }
}

/**
 * 削除ログを取得
 */
export async function getDeleteLogs(limitCount: number = 50): Promise<Array<{
  id: string
  bookId: string
  bookData: any
  deleteReason: string
  deletedBy: string
  deletedAt: any
}>> {
  try {
    const logsQuery = query(
      collection(db, "admin_delete_logs"),
      orderBy("deletedAt", "desc"),
      limit(limitCount)
    )
    
    const logsSnapshot = await getDocs(logsQuery)
    
    return logsSnapshot.docs.map(doc => ({
      id: doc.id,
      bookId: doc.data().bookId,
      bookData: doc.data().bookData,
      deleteReason: doc.data().deleteReason,
      deletedBy: doc.data().deletedBy,
      deletedAt: doc.data().deletedAt
    }))
  } catch (error) {
    console.error("削除ログ取得エラー:", error)
    return []
  }
}

/**
 * 出品統計を取得
 */
export async function getBookStats(): Promise<{
  totalBooks: number
  availableBooks: number
  soldBooks: number
  pendingApproval: number
  flaggedBooks: number
  booksThisWeek: number
}> {
  try {
    const [
      allBooks,
      flaggedBooks
    ] = await Promise.all([
      getDocs(collection(db, "books")),
      getDocs(query(collection(db, "books"), where("flaggedCount", ">", 0)))
    ])

    // 売り切れ済み: status='sold' OR transactionStatus in ['paid', 'completed']
    const [soldByStatus, soldByTransaction] = await Promise.all([
      getDocs(query(collection(db, "books"), where("status", "==", "sold"))),
      getDocs(query(collection(db, "books"), where("transactionStatus", "in", ["paid", "completed"])))
    ])

    // 重複を除去して売り切れ済み数を計算
    const soldBookIds = new Set<string>()
    soldByStatus.docs.forEach(doc => soldBookIds.add(doc.id))
    soldByTransaction.docs.forEach(doc => soldBookIds.add(doc.id))
    const soldBooks = soldBookIds.size

    // 販売中: 全体から売り切れ済みを除いた数
    const availableBooks = allBooks.size - soldBooks
    
    console.log(`[Book Stats] 全出品: ${allBooks.size}, 売切済: ${soldBooks}, 販売中: ${availableBooks}`)
    
    // 承認待ち (isApproved が false)
    const pendingApprovalBooks = await getDocs(
      query(collection(db, "books"), where("isApproved", "==", false))
    )
    
    // 今週の出品数
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoTimestamp = Timestamp.fromDate(weekAgo)
    
    const booksThisWeekSnapshot = await getDocs(
      query(collection(db, "books"), where("createdAt", ">=", weekAgoTimestamp))
    )
    
    return {
      totalBooks: allBooks.size,
      availableBooks,
      soldBooks,
      pendingApproval: pendingApprovalBooks.size,
      flaggedBooks: flaggedBooks.size,
      booksThisWeek: booksThisWeekSnapshot.size
    }
  } catch (error) {
    console.error("出品統計取得エラー:", error)
    return {
      totalBooks: 0,
      availableBooks: 0,
      soldBooks: 0,
      pendingApproval: 0,
      flaggedBooks: 0,
      booksThisWeek: 0
    }
  }
}

/**
 * 出品の詳細情報を取得（管理者用）
 */
export async function getBookDetails(bookId: string): Promise<AdminBookProfile | null> {
  try {
    const bookDoc = await getDoc(doc(db, "books", bookId))
    
    if (!bookDoc.exists()) {
      return null
    }
    
    const bookData = bookDoc.data()
    
    // 出品者情報を取得
    let sellerInfo = null
    if (bookData.userId) {
      try {
        const userDoc = await getDoc(doc(db, "users", bookData.userId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          sellerInfo = {
            name: userData.fullName || '不明',
            email: userData.email || '不明',
            university: userData.university || '不明'
          }
        }
      } catch (error) {
        console.error('出品者情報取得エラー:', error)
      }
    }
    
    return {
      id: bookDoc.id,
      title: bookData.title || '',
      author: bookData.author || '',
      price: bookData.price || 0,
      condition: bookData.condition || '',
      description: bookData.description || '',
      imageUrl: bookData.imageUrl,
      status: bookData.status || 'available',
      transactionStatus: bookData.transactionStatus,
      userId: bookData.userId || '',
      sellerName: sellerInfo?.name,
      sellerEmail: sellerInfo?.email,
      university: sellerInfo?.university,
      createdAt: bookData.createdAt,
      updatedAt: bookData.updatedAt,
      paidAt: bookData.paidAt,
      completedAt: bookData.completedAt,
      viewCount: bookData.viewCount || 0,
      flaggedCount: bookData.flaggedCount || 0,
      isApproved: bookData.isApproved !== false,
      adminNotes: bookData.adminNotes || '',
      // 追加のFirestore詳細情報
      paymentIntentId: bookData.paymentIntentId,
      buyerId: bookData.buyerId,
      purchasedAt: bookData.purchasedAt,
      deleteReason: bookData.deleteReason,
      deletedAt: bookData.deletedAt,
      statusReason: bookData.statusReason,
      category: bookData.category,
      isbn: bookData.isbn,
      publisher: bookData.publisher,
      year: bookData.year
    }
  } catch (error) {
    console.error("出品詳細取得エラー:", error)
    throw error
  }
}

/**
 * 出品情報を更新（管理者用）
 */
export async function updateBookDetails(
  bookId: string,
  updates: Partial<{
    title: string
    author: string
    price: number
    condition: string
    description: string
    status: 'available' | 'reserved' | 'sold'
    transactionStatus: 'pending' | 'paid' | 'completed'
    isApproved: boolean
    adminNotes: string
    category: string
    isbn: string
    publisher: string
    year: number
  }>
): Promise<void> {
  try {
    const bookRef = doc(db, "books", bookId)
    await updateDoc(bookRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log(`出品 ${bookId} の情報を更新しました`)
  } catch (error) {
    console.error("出品情報更新エラー:", error)
    throw error
  }
}