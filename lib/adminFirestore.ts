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
      recentSignups,
      reportsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "books")),
      (() => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoTimestamp = Timestamp.fromDate(weekAgo)
        return getDocs(query(collection(db, "users"), where("createdAt", ">=", weekAgoTimestamp)))
      })(),
      getDocs(collection(db, "reports"))
    ])

    // 要確認コンテンツ数を計算（未確認 + 確認済みだが未解決の通報）
    const flaggedContentCount = reportsSnapshot.docs.filter(doc => {
      const status = doc.data().status
      return status === 'pending' || status === 'reviewed'
    }).length

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
      flaggedContent: flaggedContentCount,
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
 * 通報一覧を取得
 */
export async function getReports(
  limitCount: number = 50,
  status?: 'pending' | 'reviewed' | 'resolved'
): Promise<{
  reports: Array<{
    id: string
    reporterId: string
    reportedUserId: string
    conversationId?: string
    textbookId?: string
    reason: string
    details?: string
    reporterName: string
    reportedUserName: string
    textbookTitle?: string
    createdAt: Timestamp
    status: 'pending' | 'reviewed' | 'resolved'
    reviewed: boolean
    adminNotes?: string
    resolvedAt?: Timestamp
    resolvedBy?: string
  }>
}> {
  try {
    let q: any
    
    if (status) {
      // ステータスフィルタがある場合は、まずステータスでフィルタして後でソート
      q = query(
        collection(db, "reports"),
        where("status", "==", status),
        limit(limitCount)
      )
    } else {
      // ステータスフィルタがない場合は、作成日でソート
      q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )
    }

    const snapshot = await getDocs(q)
    let reports = snapshot.docs.map(doc => {
      const data = doc.data() as any
      return {
        id: doc.id,
        reporterId: data?.reporterId || '',
        reportedUserId: data?.reportedUserId || '',
        conversationId: data?.conversationId,
        textbookId: data?.textbookId,
        reason: data?.reason || '',
        details: data?.details,
        reporterName: data?.reporterName || '',
        reportedUserName: data?.reportedUserName || '',
        textbookTitle: data?.textbookTitle,
        createdAt: data?.createdAt || Timestamp.now(),
        status: data?.status || 'pending',
        reviewed: data?.reviewed || false,
        adminNotes: data?.adminNotes,
        resolvedAt: data?.resolvedAt,
        resolvedBy: data?.resolvedBy
      }
    }) as Array<{
      id: string
      reporterId: string
      reportedUserId: string
      conversationId?: string
      textbookId?: string
      reason: string
      details?: string
      reporterName: string
      reportedUserName: string
      textbookTitle?: string
      createdAt: Timestamp
      status: 'pending' | 'reviewed' | 'resolved'
      reviewed: boolean
      adminNotes?: string
      resolvedAt?: Timestamp
      resolvedBy?: string
    }>

    // ステータスフィルタがある場合は、クライアントサイドで作成日順にソート
    if (status) {
      reports = reports.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime // 降順（新しい順）
      })
    }

    return { reports }
  } catch (error) {
    console.error("通報一覧取得エラー:", error)
    return { reports: [] }
  }
}

/**
 * 通報の状態を更新
 */
export async function updateReportStatus(
  reportId: string,
  status: 'pending' | 'reviewed' | 'resolved',
  adminNotes?: string,
  adminId?: string
): Promise<void> {
  try {
    const reportRef = doc(db, "reports", reportId)
    const updateData: any = {
      status,
      reviewed: true
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes
    }

    if (status === 'resolved') {
      updateData.resolvedAt = Timestamp.now()
      if (adminId) {
        updateData.resolvedBy = adminId
      }
    }

    await updateDoc(reportRef, updateData)
    console.log(`通報 ${reportId} の状態を ${status} に更新しました`)
  } catch (error) {
    console.error("通報状態更新エラー:", error)
    throw error
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
    
    // undefined値を除外
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    await updateDoc(bookRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now()
    })
    
    console.log(`出品 ${bookId} の情報を更新しました`)
  } catch (error) {
    console.error("出品情報更新エラー:", error)
    throw error
  }
}

// メッセージ管理機能
export interface AdminConversation {
  id: string
  buyerId: string
  sellerId: string
  bookId: string
  bookTitle: string
  buyerName: string
  sellerName: string
  lastMessage: string
  lastMessageAt: Timestamp
  messageCount: number
  createdAt: Timestamp
}

export interface AdminMessage {
  id: string
  conversationId: string
  text: string
  senderId: string
  senderName: string
  createdAt: Timestamp
  isRead: boolean
  isSystemMessage?: boolean
  isReported?: boolean
}

/**
 * 全ての会話を取得（管理者用）
 */
export async function getAllConversations(
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ conversations: AdminConversation[], lastDoc?: QueryDocumentSnapshot }> {
  try {
    console.log("会話一覧取得開始...")
    
    // まず、シンプルに全ての会話を取得してみる
    let q = query(collection(db, "conversations"), limit(pageSize))
    
    // createdAtフィールドが存在するかチェックしてからorderByを適用
    try {
      q = query(collection(db, "conversations"), orderBy("createdAt", "desc"), limit(pageSize))
    } catch (orderError) {
      console.warn("createdAtでの並び替えに失敗。並び替えなしで実行:", orderError)
      q = query(collection(db, "conversations"), limit(pageSize))
    }
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const snapshot = await getDocs(q)
    console.log(`取得した会話数: ${snapshot.docs.length}`)
    
    if (snapshot.empty) {
      console.log("会話が見つかりませんでした")
      return { conversations: [], lastDoc: undefined }
    }
    
    const conversations: AdminConversation[] = []
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      console.log(`会話データ:`, { id: docSnap.id, data })
      
      try {
        // 購入者・販売者・教科書情報を取得
        const [buyerDoc, sellerDoc, bookDoc] = await Promise.all([
          getDoc(doc(db, "users", data.buyerId || "")).catch(() => null),
          getDoc(doc(db, "users", data.sellerId || "")).catch(() => null),
          getDoc(doc(db, "books", data.bookId || "")).catch(() => null)
        ])
        
        // メッセージ数と最新メッセージを取得
        const messagesQuery = query(
          collection(db, "conversations", docSnap.id, "messages"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
        const messagesSnapshot = await getDocs(collection(db, "conversations", docSnap.id, "messages"))
        const latestMessageSnapshot = await getDocs(messagesQuery)
        
        let lastMessage = ""
        let lastMessageAt = data.createdAt
        
        if (!latestMessageSnapshot.empty) {
          const latestMsg = latestMessageSnapshot.docs[0].data()
          lastMessage = latestMsg.text || ""
          lastMessageAt = latestMsg.createdAt || data.createdAt
        }
        
        conversations.push({
          id: docSnap.id,
          buyerId: data.buyerId || "",
          sellerId: data.sellerId || "",
          bookId: data.bookId || "",
          bookTitle: (bookDoc && bookDoc.exists()) ? (bookDoc.data()?.title || "不明な教科書") : "削除された教科書",
          buyerName: (buyerDoc && buyerDoc.exists()) ? 
            (buyerDoc.data()?.nickname || buyerDoc.data()?.fullName || "不明なユーザー") : 
            "不明なユーザー",
          sellerName: (sellerDoc && sellerDoc.exists()) ? 
            (sellerDoc.data()?.nickname || sellerDoc.data()?.fullName || "不明なユーザー") : 
            "不明なユーザー",
          lastMessage,
          lastMessageAt,
          messageCount: messagesSnapshot.size,
          createdAt: data.createdAt || Timestamp.now()
        })
      } catch (docError) {
        console.error(`会話 ${docSnap.id} の処理エラー:`, docError)
        // エラーが発生した会話もリストに含める（基本情報のみ）
        conversations.push({
          id: docSnap.id,
          buyerId: data.buyerId || "",
          sellerId: data.sellerId || "",
          bookId: data.bookId || "",
          bookTitle: "データ取得エラー",
          buyerName: "データ取得エラー",
          sellerName: "データ取得エラー",
          lastMessage: "データ取得エラー",
          lastMessageAt: data.createdAt || Timestamp.now(),
          messageCount: 0,
          createdAt: data.createdAt || Timestamp.now()
        })
      }
    }
    
    console.log(`処理完了。会話数: ${conversations.length}`)
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    return {
      conversations,
      lastDoc: newLastDoc
    }
  } catch (error) {
    console.error("会話一覧取得エラー:", error)
    throw error
  }
}

/**
 * 特定の会話のメッセージを取得（管理者用）
 */
export async function getConversationMessages(conversationId: string): Promise<AdminMessage[]> {
  try {
    const messagesQuery = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    )
    
    const messagesSnapshot = await getDocs(messagesQuery)
    
    const messages: AdminMessage[] = []
    
    for (const msgDoc of messagesSnapshot.docs) {
      const msgData = msgDoc.data()
      
      let senderName = "システム"
      if (msgData.senderId !== "system") {
        const senderDoc = await getDoc(doc(db, "users", msgData.senderId))
        senderName = senderDoc.exists() ? 
          (senderDoc.data().nickname || senderDoc.data().fullName) : 
          "不明なユーザー"
      }
      
      messages.push({
        id: msgDoc.id,
        conversationId,
        text: msgData.text,
        senderId: msgData.senderId,
        senderName,
        createdAt: msgData.createdAt,
        isRead: msgData.isRead || false,
        isSystemMessage: msgData.isSystemMessage || false,
        isReported: msgData.isReported || false
      })
    }
    
    return messages
  } catch (error) {
    console.error("メッセージ取得エラー:", error)
    throw error
  }
}

/**
 * メッセージを削除（管理者用）
 */
export async function deleteMessage(conversationId: string, messageId: string, reason: string): Promise<void> {
  try {
    // メッセージを削除
    await deleteDoc(doc(db, "conversations", conversationId, "messages", messageId))
    
    // 削除ログを記録
    await addDoc(collection(db, "admin_message_delete_logs"), {
      conversationId,
      messageId,
      deleteReason: reason,
      deletedBy: "admin", // 実際の管理者IDを使用する場合は修正
      deletedAt: Timestamp.now()
    })
    
    console.log(`メッセージ ${messageId} を削除しました`)
  } catch (error) {
    console.error("メッセージ削除エラー:", error)
    throw error
  }
}

/**
 * 会話を削除（管理者用）
 */
export async function deleteConversation(conversationId: string, reason: string): Promise<void> {
  try {
    // 会話内の全メッセージを削除
    const messagesSnapshot = await getDocs(collection(db, "conversations", conversationId, "messages"))
    const deletePromises = messagesSnapshot.docs.map(msgDoc => deleteDoc(msgDoc.ref))
    await Promise.all(deletePromises)
    
    // 会話を削除
    await deleteDoc(doc(db, "conversations", conversationId))
    
    // 削除ログを記録
    await addDoc(collection(db, "admin_conversation_delete_logs"), {
      conversationId,
      deleteReason: reason,
      deletedBy: "admin", // 実際の管理者IDを使用する場合は修正
      deletedAt: Timestamp.now(),
      messageCount: messagesSnapshot.size
    })
    
    console.log(`会話 ${conversationId} を削除しました`)
  } catch (error) {
    console.error("会話削除エラー:", error)
    throw error
  }
}

// 取引管理機能
export interface AdminTransaction {
  id: string
  bookId: string
  bookTitle: string
  bookPrice: number
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  status: 'available' | 'reserved' | 'sold'
  transactionStatus: 'pending' | 'paid' | 'completed'
  paymentIntentId?: string
  stripeAccountId?: string
  createdAt: Timestamp
  purchasedAt?: Timestamp
  completedAt?: Timestamp
  university?: string
  condition?: string
  meetupLocation?: string
}

export interface TransactionStats {
  totalTransactions: number
  pendingTransactions: number
  paidTransactions: number
  completedTransactions: number
  totalAmount: number
  totalRevenue: number
  averageTransactionValue: number
  completionRate: number
}

/**
 * 全ての取引を取得（管理者用）
 */
export async function getAllTransactions(
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
  filters?: {
    status?: 'available' | 'reserved' | 'sold'
    transactionStatus?: 'pending' | 'paid' | 'completed'
    university?: string
    dateFrom?: Date
    dateTo?: Date
  }
): Promise<{ transactions: AdminTransaction[], lastDoc?: QueryDocumentSnapshot }> {
  try {
    console.log("取引一覧取得開始...")
    
    let q = query(collection(db, "books"), orderBy("createdAt", "desc"))
    
    // フィルタ適用
    if (filters?.status) {
      q = query(q, where("status", "==", filters.status))
    }
    
    if (filters?.transactionStatus) {
      q = query(q, where("transactionStatus", "==", filters.transactionStatus))
    }
    
    if (filters?.university) {
      q = query(q, where("university", "==", filters.university))
    }
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    q = query(q, limit(pageSize))
    
    const snapshot = await getDocs(q)
    console.log(`取得した取引数: ${snapshot.docs.length}`)
    
    if (snapshot.empty) {
      console.log("取引が見つかりませんでした")
      return { transactions: [], lastDoc: undefined }
    }
    
    const transactions: AdminTransaction[] = []
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      
      try {
        // 購入者・販売者情報を取得
        const [buyerDoc, sellerDoc] = await Promise.all([
          data.buyerId ? getDoc(doc(db, "users", data.buyerId)).catch(() => null) : Promise.resolve(null),
          getDoc(doc(db, "users", data.userId || "")).catch(() => null)
        ])
        
        transactions.push({
          id: docSnap.id,
          bookId: docSnap.id,
          bookTitle: data.title || "不明な教科書",
          bookPrice: data.price || 0,
          buyerId: data.buyerId || "",
          buyerName: (buyerDoc && buyerDoc.exists()) ? 
            (buyerDoc.data()?.nickname || buyerDoc.data()?.fullName || "不明な購入者") : 
            "未購入",
          sellerId: data.userId || "",
          sellerName: (sellerDoc && sellerDoc.exists()) ? 
            (sellerDoc.data()?.nickname || sellerDoc.data()?.fullName || "不明な販売者") : 
            "不明な販売者",
          status: data.status || 'available',
          transactionStatus: data.transactionStatus || 'pending',
          paymentIntentId: data.paymentIntentId,
          stripeAccountId: data.stripeAccountId,
          createdAt: data.createdAt || Timestamp.now(),
          purchasedAt: data.purchasedAt,
          completedAt: data.completedAt,
          university: data.university,
          condition: data.condition,
          meetupLocation: data.meetupLocation
        })
      } catch (docError) {
        console.error(`取引 ${docSnap.id} の処理エラー:`, docError)
        // エラーが発生した取引もリストに含める（基本情報のみ）
        transactions.push({
          id: docSnap.id,
          bookId: docSnap.id,
          bookTitle: data.title || "データ取得エラー",
          bookPrice: data.price || 0,
          buyerId: data.buyerId || "",
          buyerName: "データ取得エラー",
          sellerId: data.userId || "",
          sellerName: "データ取得エラー",
          status: data.status || 'available',
          transactionStatus: data.transactionStatus || 'pending',
          createdAt: data.createdAt || Timestamp.now(),
          university: data.university,
          condition: data.condition
        })
      }
    }
    
    console.log(`処理完了。取引数: ${transactions.length}`)
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    return {
      transactions,
      lastDoc: newLastDoc
    }
  } catch (error) {
    console.error("取引一覧取得エラー:", error)
    throw error
  }
}

/**
 * 取引統計を取得（管理者用）
 */
export async function getTransactionStats(): Promise<TransactionStats> {
  try {
    console.log("取引統計取得開始...")
    
    // 全ての教科書を取得
    const allBooksSnapshot = await getDocs(collection(db, "books"))
    
    // 売却済みの教科書（取引あり）
    const soldBooks = allBooksSnapshot.docs.filter(doc => doc.data().status === 'sold')
    
    // 決済済み
    const paidBooks = soldBooks.filter(doc => doc.data().transactionStatus === 'paid')
    
    // 完了済み
    const completedBooks = soldBooks.filter(doc => doc.data().transactionStatus === 'completed')
    
    // 保留中
    const pendingBooks = soldBooks.filter(doc => 
      !doc.data().transactionStatus || doc.data().transactionStatus === 'pending'
    )
    
    // 金額計算
    const totalAmount = soldBooks.reduce((sum, doc) => sum + (doc.data().price || 0), 0)
    const totalRevenue = Math.floor(totalAmount * 0.064) // 6.4%の手数料
    const averageTransactionValue = soldBooks.length > 0 ? totalAmount / soldBooks.length : 0
    const completionRate = soldBooks.length > 0 ? (completedBooks.length / soldBooks.length) * 100 : 0
    
    const stats: TransactionStats = {
      totalTransactions: soldBooks.length,
      pendingTransactions: pendingBooks.length,
      paidTransactions: paidBooks.length,
      completedTransactions: completedBooks.length,
      totalAmount,
      totalRevenue,
      averageTransactionValue,
      completionRate
    }
    
    console.log("取引統計:", stats)
    return stats
  } catch (error) {
    console.error("取引統計取得エラー:", error)
    throw error
  }
}

/**
 * 取引状態を更新（管理者用）
 */
export async function updateTransactionStatus(
  bookId: string,
  status: 'available' | 'reserved' | 'sold',
  transactionStatus?: 'pending' | 'paid' | 'completed',
  reason?: string
): Promise<void> {
  try {
    const bookRef = doc(db, "books", bookId)
    
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    }
    
    if (transactionStatus) {
      updateData.transactionStatus = transactionStatus
      
      if (transactionStatus === 'completed') {
        updateData.completedAt = Timestamp.now()
      }
    }
    
    await updateDoc(bookRef, updateData)
    
    // 更新ログを記録
    await addDoc(collection(db, "admin_transaction_logs"), {
      bookId,
      previousStatus: status,
      newStatus: status,
      previousTransactionStatus: transactionStatus,
      newTransactionStatus: transactionStatus,
      reason: reason || "管理者による手動更新",
      updatedBy: "admin", // 実際の管理者IDを使用する場合は修正
      updatedAt: Timestamp.now()
    })
    
    console.log(`取引 ${bookId} の状態を更新しました`)
  } catch (error) {
    console.error("取引状態更新エラー:", error)
    throw error
  }
}

/**
 * 問題のある取引を取得
 */
export async function getProblematicTransactions(): Promise<AdminTransaction[]> {
  try {
    console.log("問題のある取引検索開始...")
    
    // インデックス不要な方法：まず売却済みの取引を全て取得してからフィルタリング
    const soldBooksQuery = query(
      collection(db, "books"),
      where("status", "==", "sold")
    )
    
    const snapshot = await getDocs(soldBooksQuery)
    console.log(`売却済み取引数: ${snapshot.docs.length}`)
    
    // 30日以上前の日付
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo)
    
    // クライアントサイドでフィルタリング
    const problematicDocs = snapshot.docs.filter(doc => {
      const data = doc.data()
      const transactionStatus = data.transactionStatus
      const purchasedAt = data.purchasedAt
      
      // 未完了（pending または paid）で、30日以上前に購入された取引
      const isIncomplete = !transactionStatus || transactionStatus === 'pending' || transactionStatus === 'paid'
      const isOld = purchasedAt && purchasedAt.seconds < thirtyDaysAgoTimestamp.seconds
      
      return isIncomplete && isOld
    })
    
    console.log(`問題のある取引数: ${problematicDocs.length}`)
    const transactions: AdminTransaction[] = []
    
    for (const docSnap of problematicDocs) {
      const data = docSnap.data()
      
      const [buyerDoc, sellerDoc] = await Promise.all([
        data.buyerId ? getDoc(doc(db, "users", data.buyerId)).catch(() => null) : Promise.resolve(null),
        getDoc(doc(db, "users", data.userId || "")).catch(() => null)
      ])
      
      transactions.push({
        id: docSnap.id,
        bookId: docSnap.id,
        bookTitle: data.title || "不明な教科書",
        bookPrice: data.price || 0,
        buyerId: data.buyerId || "",
        buyerName: (buyerDoc && buyerDoc.exists()) ? 
          (buyerDoc.data()?.nickname || buyerDoc.data()?.fullName || "不明な購入者") : 
          "未購入",
        sellerId: data.userId || "",
        sellerName: (sellerDoc && sellerDoc.exists()) ? 
          (sellerDoc.data()?.nickname || sellerDoc.data()?.fullName || "不明な販売者") : 
          "不明な販売者",
        status: data.status || 'available',
        transactionStatus: data.transactionStatus || 'pending',
        paymentIntentId: data.paymentIntentId,
        stripeAccountId: data.stripeAccountId,
        createdAt: data.createdAt || Timestamp.now(),
        purchasedAt: data.purchasedAt,
        completedAt: data.completedAt,
        university: data.university,
        condition: data.condition,
        meetupLocation: data.meetupLocation
      })
    }
    
    return transactions
  } catch (error) {
    console.error("問題のある取引取得エラー:", error)
    throw error
  }
}

// レポート・分析機能
export interface DetailedAnalytics {
  // 基本統計
  totalUsers: number
  totalBooks: number
  totalTransactions: number
  totalRevenue: number
  
  // 時系列データ
  dailyStats: {
    date: string
    users: number
    books: number
    transactions: number
    revenue: number
  }[]
  
  // 大学別統計
  universityStats: {
    university: string
    userCount: number
    bookCount: number
    transactionCount: number
    averagePrice: number
  }[]
  
  // カテゴリ別統計
  categoryStats: {
    category: string
    count: number
    totalRevenue: number
    averagePrice: number
  }[]
  
  // ユーザー行動分析
  userBehavior: {
    averageListingsPerUser: number
    averagePurchasesPerUser: number
    topSellerStats: {
      userId: string
      name: string
      totalSales: number
      totalRevenue: number
    }[]
    topBuyerStats: {
      userId: string
      name: string
      totalPurchases: number
      totalSpent: number
    }[]
  }
  
  // 取引分析
  transactionAnalysis: {
    averageCompletionTime: number // 日数
    completionRateByUniversity: {
      university: string
      completionRate: number
    }[]
    priceDistribution: {
      range: string
      count: number
    }[]
  }
}

/**
 * 詳細分析データを取得
 */
export async function getDetailedAnalytics(
  dateFrom?: Date,
  dateTo?: Date
): Promise<DetailedAnalytics> {
  try {
    console.log("詳細分析データ取得開始...")
    
    // 日付範囲設定
    const endDate = dateTo || new Date()
    const startDate = dateFrom || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30日前
    
    // 基本データを並行取得
    const [usersSnapshot, booksSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "books"))
    ])
    
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
    const books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
    const soldBooks = books.filter((book: any) => book.status === 'sold')
    
    // 基本統計
    const totalUsers = users.length
    const totalBooks = books.length
    const totalTransactions = soldBooks.length
    const totalRevenue = Math.floor(soldBooks.reduce((sum: number, book: any) => sum + (book.price || 0), 0) * 0.064)
    
    // 時系列データ生成（過去30日）
    const dailyStats = generateDailyStats(users, books, startDate, endDate)
    
    // 大学別統計
    const universityStats = generateUniversityStats(users, books)
    
    // カテゴリ別統計
    const categoryStats = generateCategoryStats(books)
    
    // ユーザー行動分析
    const userBehavior = await generateUserBehaviorStats(users, books)
    
    // 取引分析
    const transactionAnalysis = generateTransactionAnalysis(books)
    
    const analytics: DetailedAnalytics = {
      totalUsers,
      totalBooks,
      totalTransactions,
      totalRevenue,
      dailyStats,
      universityStats,
      categoryStats,
      userBehavior,
      transactionAnalysis
    }
    
    console.log("詳細分析データ取得完了")
    return analytics
  } catch (error) {
    console.error("詳細分析データ取得エラー:", error)
    throw error
  }
}

/**
 * 日次統計データを生成
 */
function generateDailyStats(users: any[], books: any[], startDate: Date, endDate: Date) {
  const dailyStats = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayStart = new Date(currentDate)
    const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
    
    // その日に作成されたユーザー数
    const dayUsers = users.filter((user: any) => {
      const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt)
      return createdAt >= dayStart && createdAt < dayEnd
    }).length
    
    // その日に作成された教科書数
    const dayBooks = books.filter((book: any) => {
      const createdAt = book.createdAt?.toDate?.() || new Date(book.createdAt)
      return createdAt >= dayStart && createdAt < dayEnd
    })
    
    // その日に完了した取引数
    const dayTransactions = books.filter((book: any) => {
      const completedAt = book.completedAt?.toDate?.() || (book.completedAt ? new Date(book.completedAt) : null)
      return completedAt && completedAt >= dayStart && completedAt < dayEnd
    })
    
    const dayRevenue = Math.floor(dayTransactions.reduce((sum: number, book: any) => sum + (book.price || 0), 0) * 0.064)
    
    dailyStats.push({
      date: dateStr,
      users: dayUsers,
      books: dayBooks.length,
      transactions: dayTransactions.length,
      revenue: dayRevenue
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dailyStats
}

/**
 * 大学別統計を生成
 */
function generateUniversityStats(users: any[], books: any[]) {
  const universityMap = new Map()
  
  // ユーザー数を集計
  users.forEach((user: any) => {
    const university = user.university || '不明'
    if (!universityMap.has(university)) {
      universityMap.set(university, {
        university,
        userCount: 0,
        bookCount: 0,
        transactionCount: 0,
        totalRevenue: 0
      })
    }
    universityMap.get(university).userCount++
  })
  
  // 教科書数と取引数を集計
  books.forEach((book: any) => {
    const university = book.university || '不明'
    if (!universityMap.has(university)) {
      universityMap.set(university, {
        university,
        userCount: 0,
        bookCount: 0,
        transactionCount: 0,
        totalRevenue: 0
      })
    }
    
    const stats = universityMap.get(university)
    stats.bookCount++
    
    if (book.status === 'sold') {
      stats.transactionCount++
      stats.totalRevenue += book.price || 0
    }
  })
  
  // 平均価格を計算
  return Array.from(universityMap.values()).map(stats => ({
    ...stats,
    averagePrice: stats.transactionCount > 0 ? stats.totalRevenue / stats.transactionCount : 0
  })).sort((a, b) => b.transactionCount - a.transactionCount)
}

/**
 * カテゴリ別統計を生成
 */
function generateCategoryStats(books: any[]) {
  const categoryMap = new Map()
  
  books.forEach((book: any) => {
    const category = book.genre || book.category || 'その他'
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        count: 0,
        totalRevenue: 0
      })
    }
    
    const stats = categoryMap.get(category)
    stats.count++
    
    if (book.status === 'sold') {
      stats.totalRevenue += book.price || 0
    }
  })
  
  return Array.from(categoryMap.values()).map(stats => ({
    ...stats,
    averagePrice: stats.count > 0 ? stats.totalRevenue / stats.count : 0
  })).sort((a, b) => b.count - a.count)
}

/**
 * ユーザー行動統計を生成
 */
async function generateUserBehaviorStats(users: any[], books: any[]) {
  // ユーザーごとの出品数を計算
  const userListings = new Map()
  const userPurchases = new Map()
  
  books.forEach((book: any) => {
    // 出品数
    const sellerId = book.userId
    if (sellerId) {
      userListings.set(sellerId, (userListings.get(sellerId) || 0) + 1)
    }
    
    // 購入数
    if (book.status === 'sold' && book.buyerId) {
      userPurchases.set(book.buyerId, (userPurchases.get(book.buyerId) || 0) + 1)
    }
  })
  
  const averageListingsPerUser = userListings.size > 0 ? 
    Array.from(userListings.values()).reduce((sum: number, count: number) => sum + count, 0) / users.length : 0
  
  const averagePurchasesPerUser = userPurchases.size > 0 ?
    Array.from(userPurchases.values()).reduce((sum: number, count: number) => sum + count, 0) / users.length : 0
  
  // トップセラー（販売件数で並び替え）
  const topSellers = Array.from(userListings.entries())
    .sort(([,a], [,b]) => b - a) // 販売件数の多い順
    .slice(0, 10)
    .map(([userId, count]) => {
      const user = users.find((u: any) => u.id === userId)
      const userBooks = books.filter((b: any) => b.userId === userId && b.status === 'sold')
      const totalRevenue = userBooks.reduce((sum: number, book: any) => sum + (book.price || 0), 0)
      
      return {
        userId,
        name: user?.nickname || user?.fullName || '不明なユーザー',
        totalSales: count,
        totalRevenue
      }
    })
  
  // トップバイヤー（購入件数で並び替え）
  const topBuyers = Array.from(userPurchases.entries())
    .sort(([,a], [,b]) => b - a) // 購入件数の多い順
    .slice(0, 10)
    .map(([userId, count]) => {
      const user = users.find((u: any) => u.id === userId)
      const userBoughtBooks = books.filter((b: any) => b.buyerId === userId && b.status === 'sold')
      const totalSpent = userBoughtBooks.reduce((sum: number, book: any) => sum + (book.price || 0), 0)
      
      return {
        userId,
        name: user?.nickname || user?.fullName || '不明なユーザー',
        totalPurchases: count,
        totalSpent
      }
    })
  
  return {
    averageListingsPerUser,
    averagePurchasesPerUser,
    topSellerStats: topSellers,
    topBuyerStats: topBuyers
  }
}

/**
 * 取引分析を生成
 */
function generateTransactionAnalysis(books: any[]) {
  const soldBooks = books.filter((book: any) => book.status === 'sold')
  
  // 平均完了時間を計算
  const completionTimes = soldBooks
    .filter((book: any) => book.purchasedAt && book.completedAt)
    .map((book: any) => {
      const purchased = book.purchasedAt.toDate ? book.purchasedAt.toDate() : new Date(book.purchasedAt)
      const completed = book.completedAt.toDate ? book.completedAt.toDate() : new Date(book.completedAt)
      return (completed.getTime() - purchased.getTime()) / (1000 * 60 * 60 * 24) // 日数
    })
  
  const averageCompletionTime = completionTimes.length > 0 ?
    completionTimes.reduce((sum: number, time: number) => sum + time, 0) / completionTimes.length : 0
  
  // 大学別完了率
  const universityCompletionMap = new Map()
  books.forEach((book: any) => {
    const university = book.university || '不明'
    if (!universityCompletionMap.has(university)) {
      universityCompletionMap.set(university, { total: 0, completed: 0 })
    }
    
    const stats = universityCompletionMap.get(university)
    if (book.status === 'sold') {
      stats.total++
      if (book.transactionStatus === 'completed') {
        stats.completed++
      }
    }
  })
  
  const completionRateByUniversity = Array.from(universityCompletionMap.entries())
    .map(([university, stats]) => ({
      university,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }))
    .filter(item => item.completionRate > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
  
  // 価格分布
  const priceRanges = [
    { range: '0-1,000円', min: 0, max: 1000 },
    { range: '1,001-3,000円', min: 1001, max: 3000 },
    { range: '3,001-5,000円', min: 3001, max: 5000 },
    { range: '5,001-10,000円', min: 5001, max: 10000 },
    { range: '10,001円以上', min: 10001, max: Infinity }
  ]
  
  const priceDistribution = priceRanges.map(range => ({
    range: range.range,
    count: books.filter((book: any) => {
      const price = book.price || 0
      return price >= range.min && price <= range.max
    }).length
  }))
  
  return {
    averageCompletionTime,
    completionRateByUniversity,
    priceDistribution
  }
}