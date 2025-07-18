import { db } from "./firebaseConfig"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  getDoc,
  doc,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"

export interface Textbook {
  id: string
  title: string
  author?: string
  isbn?: string
  price: number
  condition: string
  description?: string
  imageUrls?: string[]
  imageUrl?: string
  userId: string
  university?: string
  meetupLocation?: string
  sellerName?: string
  views?: number
  status?: 'available' | 'reserved' | 'sold'
  buyerId?: string
  createdAt: Timestamp
  purchasedAt?: Timestamp
  expirationDate?: string | null
  genre?: string
  transactionStatus?: 'pending' | 'paid' | 'completed'
  completedAt?: Timestamp
}

export interface UserProfile {
  fullName: string
  email: string
  studentId?: string
  university: string
  grade?: string           // 学年（新規追加）
  nickname?: string
  avatarUrl?: string
  isOfficial?: boolean
  officialType?: 'admin' | 'support' | 'team'
  verifiedAt?: Timestamp
  emailVerified?: boolean  // メール認証状態（新規追加）
  stripeAccountId?: string // Stripe Connect アカウントID（新規追加）
  createdAt: Timestamp
}

export interface Conversation {
  id: string
  buyerId: string
  sellerId: string
  bookId: string
  createdAt: Timestamp
  lastMessage?: string
  lastMessageAt?: Timestamp
  unreadCount?: { [userId: string]: number }
}

export interface Favorite {
  id: string
  userId: string
  bookId: string
  createdAt: Timestamp
}

// ✅ ホーム画面用：新着教科書4件を取得
export const getTextbooks = async (): Promise<Textbook[]> => {
  const q = query(collection(db, "books"), orderBy("createdAt", "desc"), limit(4))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Textbook[]
}

// ✅ マーケットプレイス用：すべての教科書を取得
export const getAllTextbooks = async (): Promise<Textbook[]> => {
  const snapshot = await getDocs(collection(db, "books"))
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Textbook[]
}

// ✅ 教科書の詳細情報をIDから取得
export const getTextbookById = async (id: string): Promise<Textbook | null> => {
  if (!id) {
    console.warn("getTextbookById: IDが指定されていません")
    return null
  }
  const docRef = doc(db, "books", id)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Textbook
  }
  return null
}

// ✅ 教科書出品時の追加関数（userIdを含める）
export const addTextbook = async (data: Omit<Textbook, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, "books"), {
    ...data,
    status: data.status || 'available', // statusが未設定の場合は'available'に設定
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

// ✅ ユーザーのニックネーム取得（usersコレクションから）
export const getUserNickname = async (userId: string): Promise<string> => {
  try {
    console.log("ユーザー情報取得開始:", userId)
    const userDoc = await getDoc(doc(db, "users", userId))
    console.log("ユーザードキュメント存在確認:", userDoc.exists())
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      console.log("ユーザーデータ:", data)
      const name = data.nickname || data.fullName || "名無し"
      console.log("取得した名前:", name)
      return name
    } else {
      console.log("ユーザードキュメントが存在しません:", userId)
      return "不明なユーザー"
    }
  } catch (error) {
    console.error("ニックネーム取得失敗:", error)
    console.error("エラー詳細:", {
      code: error instanceof Error ? (error as any).code : undefined,
      message: error instanceof Error ? error.message : String(error),
      userId: userId
    })
    return "取得エラー"
  }
}

// ✅ ユーザーの詳細情報取得（ニックネーム+アバター+公式フラグ）
export const getUserProfile = async (userId: string): Promise<{name: string, avatarUrl?: string, isOfficial?: boolean, officialType?: string, stripeAccountId?: string} | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        name: data.nickname || data.fullName || "名無し",
        avatarUrl: data.avatarUrl,
        isOfficial: data.isOfficial || false,
        officialType: data.officialType,
        stripeAccountId: data.stripeAccountId
      }
    } else {
      return { name: "不明なユーザー" }
    }
  } catch (error) {
    console.error("ユーザープロフィール取得失敗:", error)
    return { name: "取得エラー" }
  }
}

// ✅ 完全なユーザープロフィール取得（useAuth用）
export const getFullUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      return data as UserProfile
    } else {
      return null
    }
  } catch (error) {
    console.error("完全ユーザープロフィール取得失敗:", error)
    return null
  }
}

// ✅ ユーザープロフィールの保存
export const saveUserProfile = async (uid: string, profile: Omit<UserProfile, 'createdAt'>): Promise<void> => {
  try {
    await setDoc(doc(db, "users", uid), {
      ...profile,
      createdAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("ユーザープロフィール保存失敗:", error)
    throw error
  }
}

// ✅ 会話スレッドを作成または既存のスレッドを取得
export const createOrGetConversation = async (
  buyerId: string,
  sellerId: string,
  bookId: string
): Promise<string> => {
  try {
    const conversationsRef = collection(db, "conversations")
    const q = query(
      conversationsRef,
      where("buyerId", "==", buyerId),
      where("sellerId", "==", sellerId),
      where("bookId", "==", bookId)
    )

    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return snapshot.docs[0].id
    }

    const newDoc = await addDoc(conversationsRef, {
      buyerId,
      sellerId,
      bookId,
      createdAt: Timestamp.now(),
    })

    return newDoc.id
  } catch (error) {
    console.error("会話スレッド作成失敗:", error)
    throw error
  }
}

// ✅ 教科書の取引状態を更新
export const updateTextbookStatus = async (
  bookId: string, 
  status: 'available' | 'reserved' | 'sold',
  buyerId?: string
): Promise<void> => {
  try {
    const bookRef = doc(db, "books", bookId)
    
    // 現在の状態を取得
    const currentBook = await getDoc(bookRef)
    const currentStatus = currentBook.exists() ? currentBook.data().status : null
    
    const updateData: any = { 
      status,
      updatedAt: Timestamp.now()
    }
    
    if (buyerId) {
      updateData.buyerId = buyerId
      // 購入時は購入日も記録
      if (status === 'sold') {
        updateData.purchasedAt = Timestamp.now()
      }
    }
    
    await setDoc(bookRef, updateData, { merge: true })
    
    // 売り切れから出品中に戻った場合は通知を送信
    if (currentStatus === 'sold' && status === 'available') {
      await notifyInterestedUsers(bookId, currentBook.data())
    }
  } catch (error) {
    console.error("教科書状態更新失敗:", error)
    throw error
  }
}

// ✅ 興味のあるユーザーに通知を送信
const notifyInterestedUsers = async (bookId: string, bookData: any): Promise<void> => {
  try {
    const { createTextbookAvailableNotification } = await import('./notifications')
    
    // お気に入りに追加しているユーザーを取得
    const favoritesRef = collection(db, "favorites")
    const favoritesQuery = query(favoritesRef, where("bookId", "==", bookId))
    const favoritesSnapshot = await getDocs(favoritesQuery)
    
    // この教科書について会話したことがあるユーザーを取得
    const conversationsRef = collection(db, "conversations")
    const conversationsQuery = query(conversationsRef, where("bookId", "==", bookId))
    const conversationsSnapshot = await getDocs(conversationsQuery)
    
    // 通知対象ユーザーIDを収集（重複を避けるためSetを使用）
    const interestedUserIds = new Set<string>()
    
    // お気に入りユーザーを追加
    favoritesSnapshot.docs.forEach(doc => {
      const userId = doc.data().userId
      if (userId && userId !== bookData.userId) { // 出品者自身は除外
        interestedUserIds.add(userId)
      }
    })
    
    // 会話参加者を追加し、同時に会話IDも保存
    const conversationData = new Map<string, string>() // userId -> conversationId
    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.buyerId && data.buyerId !== bookData.userId) {
        interestedUserIds.add(data.buyerId)
        conversationData.set(data.buyerId, doc.id)
      }
      if (data.sellerId && data.sellerId !== bookData.userId) {
        interestedUserIds.add(data.sellerId)
        conversationData.set(data.sellerId, doc.id)
      }
    })
    
    // 各ユーザーに通知を送信
    const notificationPromises = Array.from(interestedUserIds).map(userId => 
      createTextbookAvailableNotification(userId, bookData.title, bookId)
    )
    
    await Promise.all(notificationPromises)
    
    // 各会話にシステムメッセージを送信
    const messagePromises = conversationsSnapshot.docs.map(async (conversationDoc) => {
      try {
        const messagesRef = collection(db, "conversations", conversationDoc.id, "messages")
        await addDoc(messagesRef, {
          text: `📢 システム通知: 「${bookData.title}」が再び出品されました。購入をご希望の場合は、出品者にメッセージをお送りください。`,
          senderId: "system",
          createdAt: serverTimestamp(),
          isRead: false,
          isSystemMessage: true
        })
        console.log(`会話 ${conversationDoc.id} にシステムメッセージを送信しました`)
      } catch (error) {
        console.error(`会話 ${conversationDoc.id} へのメッセージ送信エラー:`, error)
      }
    })
    
    await Promise.all(messagePromises)
    
    console.log(`${interestedUserIds.size}人のユーザーに再出品通知を送信しました`)
    console.log(`${conversationsSnapshot.docs.length}件の会話にシステムメッセージを送信しました`)
  } catch (error) {
    console.error("興味のあるユーザーへの通知送信失敗:", error)
    // 通知送信の失敗は状態更新処理を妨げないようにする
  }
}

// ✅ 教科書の閲覧数を更新
export const incrementTextbookViews = async (bookId: string, userId?: string): Promise<void> => {
  try {
    const bookRef = doc(db, "books", bookId)
    const bookDoc = await getDoc(bookRef)
    
    if (!bookDoc.exists()) {
      console.warn("教科書が見つかりません:", bookId)
      return
    }
    
    const bookData = bookDoc.data()
    
    // 自分の投稿は閲覧数に含めない
    if (userId && bookData.userId === userId) {
      return
    }
    
    const currentViews = bookData.views || 0
    await setDoc(bookRef, { 
      views: currentViews + 1,
      updatedAt: Timestamp.now()
    }, { merge: true })
  } catch (error) {
    console.error("閲覧数更新失敗:", error)
    // 閲覧数の更新失敗はユーザー体験を損なわないよう、エラーを投げない
  }
}

// ✅ お気に入りに追加
export const addToFavorites = async (userId: string, bookId: string): Promise<void> => {
  try {
    console.log("お気に入り追加開始:", { userId, bookId })
    const favoritesRef = collection(db, "favorites")
    const docData = {
      userId,
      bookId,
      createdAt: Timestamp.now()
    }
    console.log("追加するデータ:", docData)
    await addDoc(favoritesRef, docData)
    console.log("お気に入り追加成功")
  } catch (error) {
    console.error("お気に入り追加失敗:", error)
    console.error("エラー詳細:", {
      code: error instanceof Error ? (error as any).code : undefined,
      message: error instanceof Error ? error.message : String(error),
      userId,
      bookId
    })
    throw error
  }
}

// ✅ お気に入りから削除
export const removeFromFavorites = async (userId: string, bookId: string): Promise<void> => {
  try {
    const favoritesRef = collection(db, "favorites")
    const q = query(
      favoritesRef,
      where("userId", "==", userId),
      where("bookId", "==", bookId)
    )
    const snapshot = await getDocs(q)
    
    const deletePromises = snapshot.docs.map(docSnap => {
      return deleteDoc(docSnap.ref)
    })
    
    await Promise.all(deletePromises)
  } catch (error) {
    console.error("お気に入り削除失敗:", error)
    throw error
  }
}

// ✅ お気に入り状態を確認
export const isFavorite = async (userId: string, bookId: string): Promise<boolean> => {
  try {
    const favoritesRef = collection(db, "favorites")
    const q = query(
      favoritesRef,
      where("userId", "==", userId),
      where("bookId", "==", bookId)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("お気に入り状態確認失敗:", error)
    return false
  }
}

// ✅ ユーザーのお気に入り教科書一覧を取得
export const getUserFavorites = async (userId: string): Promise<Textbook[]> => {
  try {
    console.log("お気に入り一覧取得開始:", userId)
    const favoritesRef = collection(db, "favorites")
    const q = query(
      favoritesRef,
      where("userId", "==", userId)
    )
    const snapshot = await getDocs(q)
    console.log("お気に入りドキュメント数:", snapshot.docs.length)
    
    // 日付順にソートしてからbookIdを取得
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.seconds || 0
      const bTime = b.data().createdAt?.seconds || 0
      return bTime - aTime // 降順（新しい順）
    })
    
    const bookIds = sortedDocs.map(doc => {
      const data = doc.data()
      console.log("お気に入りドキュメント:", { id: doc.id, data })
      return data.bookId
    })
    
    if (bookIds.length === 0) {
      console.log("お気に入りが見つかりませんでした")
      return []
    }
    
    console.log("取得する教科書ID:", bookIds)
    
    // 教科書情報を取得
    const books = await Promise.all(
      bookIds.map(async (bookId) => {
        try {
          console.log("教科書詳細取得:", bookId)
          const book = await getTextbookById(bookId)
          console.log("取得した教科書:", book ? `${book.title} (${book.id})` : "見つからず")
          return book
        } catch (error) {
          console.error("教科書詳細取得エラー:", bookId, error)
          return null
        }
      })
    )
    
    const validBooks = books.filter(book => book !== null) as Textbook[]
    console.log("有効な教科書数:", validBooks.length)
    console.log("有効な教科書一覧:", validBooks.map(book => ({ id: book.id, title: book.title })))
    return validBooks
  } catch (error) {
    console.error("お気に入り一覧取得失敗:", error)
    console.error("エラー詳細:", {
      code: error instanceof Error ? (error as any).code : undefined,
      message: error instanceof Error ? error.message : String(error),
      userId
    })
    return []
  }
}

// ✅ ユーザーの購入履歴を取得
export const getUserPurchases = async (userId: string): Promise<Textbook[]> => {
  try {
    console.log("購入履歴取得開始:", userId)
    const textbooksRef = collection(db, "books")
    const q = query(
      textbooksRef,
      where("buyerId", "==", userId),
      where("status", "==", "sold")
    )
    const snapshot = await getDocs(q)
    console.log("購入履歴ドキュメント数:", snapshot.docs.length)
    
    const purchases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Textbook[]
    
    console.log("購入履歴:", purchases)
    return purchases
  } catch (error) {
    console.error("購入履歴取得失敗:", error)
    console.error("エラー詳細:", {
      code: error instanceof Error ? (error as any).code : undefined,
      message: error instanceof Error ? error.message : String(error),
      userId
    })
    return []
  }
}

// ✅ ユーザーの出品中教科書を取得
export const getUserSellingBooks = async (userId: string): Promise<Textbook[]> => {
  try {
    console.log("出品中教科書取得開始:", userId)
    const textbooksRef = collection(db, "books")
    
    // ユーザーのすべての教科書を取得
    const userBooksQuery = query(
      textbooksRef,
      where("userId", "==", userId)
    )
    const userSnapshot = await getDocs(userBooksQuery)
    console.log("ユーザーの全教科書ドキュメント数:", userSnapshot.docs.length)
    
    const allUserBooks = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Textbook[]
    
    // statusがavailableまたは未設定（undefined/null）の教科書のみをフィルタリング
    const sellingBooks = allUserBooks.filter(book => {
      const status = book.status
      const isAvailable = status === "available" || status === undefined || status === null
      console.log(`教科書 ${book.title} - status: ${status}, isAvailable: ${isAvailable}`)
      return isAvailable
    })
    
    console.log("フィルタリング後の出品中教科書数:", sellingBooks.length)
    
    // 作成日順にソート（新しい順）
    const sortedBooks = sellingBooks.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime
    })
    
    console.log("出品中教科書:", sortedBooks)
    return sortedBooks
  } catch (error) {
    console.error("出品中教科書取得失敗:", error)
    console.error("エラー詳細:", {
      code: error instanceof Error ? (error as any).code : undefined,
      message: error instanceof Error ? error.message : String(error),
      userId
    })
    return []
  }
}

// ✅ ユーザーの取引中教科書を取得
export const getUserTransactionBooks = async (userId: string): Promise<Textbook[]> => {
  try {
    console.log("取引中教科書取得開始:", userId)
    const textbooksRef = collection(db, "books")
    const q = query(
      textbooksRef,
      where("userId", "==", userId),
      where("status", "==", "sold")
    )
    const snapshot = await getDocs(q)
    console.log("取引中教科書ドキュメント数:", snapshot.docs.length)
    
    const allSoldBooks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Textbook[]
    
    // transactionStatusが'completed'でないもの（取引中）のみを抽出
    const transactionBooks = allSoldBooks.filter(book => 
      book.transactionStatus !== 'completed'
    )
    
    // 作成日順にソート（新しい順）
    const sortedBooks = transactionBooks.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime
    })
    
    console.log("取引中教科書:", sortedBooks)
    return sortedBooks
  } catch (error) {
    console.error("取引中教科書取得失敗:", error)
    console.error("エラー詳細:", {
      code: error instanceof Error ? (error as any).code : undefined,
      message: error instanceof Error ? error.message : String(error),
      userId
    })
    return []
  }
}

// ✅ ユーザーの未読メッセージ数を取得
export const getUserUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    console.log("未読メッセージ数取得開始:", userId)
    
    // ユーザーが参加している会話を取得
    const conversationsRef = collection(db, "conversations")
    const userConversationsQuery = query(
      conversationsRef,
      where("buyerId", "==", userId)
    )
    const sellerConversationsQuery = query(
      conversationsRef,
      where("sellerId", "==", userId)
    )
    
    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      getDocs(userConversationsQuery),
      getDocs(sellerConversationsQuery)
    ])
    
    const conversationIds = new Set([
      ...buyerSnapshot.docs.map(doc => doc.id),
      ...sellerSnapshot.docs.map(doc => doc.id)
    ])
    
    let totalUnreadCount = 0
    
    // 各会話の未読メッセージ数を計算
    for (const conversationId of conversationIds) {
      const conversationDoc = await getDoc(doc(db, "conversations", conversationId))
      if (conversationDoc.exists()) {
        const data = conversationDoc.data()
        const unreadCount = data.unreadCount?.[userId] || 0
        totalUnreadCount += unreadCount
      }
    }
    
    console.log("総未読メッセージ数:", totalUnreadCount)
    return totalUnreadCount
  } catch (error) {
    console.error("未読メッセージ数取得失敗:", error)
    return 0
  }
}

// ✅ FCMトークンを保存
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'fcmTokens', userId), {
      token,
      updatedAt: Timestamp.now()
    })
    console.log('FCMトークンを保存しました')
  } catch (error) {
    console.error('FCMトークンの保存に失敗しました:', error)
    throw error
  }
}

// ✅ FCMトークンを取得
export const getFCMToken = async (userId: string): Promise<string | null> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'fcmTokens', userId))
    if (tokenDoc.exists()) {
      return tokenDoc.data().token
    }
  } catch (error) {
    console.error('FCMトークンの取得に失敗しました:', error)
  }
  return null
}

// ✅ ユーザーを公式アカウントに設定
export const setUserAsOfficial = async (
  userId: string, 
  officialType: 'admin' | 'support' | 'team' = 'admin'
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    await setDoc(userRef, {
      isOfficial: true,
      officialType: officialType,
      verifiedAt: Timestamp.now()
    }, { merge: true })
    
    console.log(`ユーザー ${userId} を公式アカウント (${officialType}) に設定しました`)
  } catch (error) {
    console.error("公式アカウント設定失敗:", error)
    throw error
  }
}

// ✅ ユーザーの公式ステータスを削除
export const removeOfficialStatus = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId)
    await setDoc(userRef, {
      isOfficial: false,
      officialType: null,
      verifiedAt: null
    }, { merge: true })
    
    console.log(`ユーザー ${userId} の公式ステータスを削除しました`)
  } catch (error) {
    console.error("公式ステータス削除失敗:", error)
    throw error
  }
}

// ✅ 既存の出品データでstatusフィールドが未設定の教科書を'available'に更新
export const updateMissingStatusFields = async (): Promise<void> => {
  try {
    console.log("statusフィールドが未設定の教科書を更新開始")
    
    // すべての教科書を取得
    const textbooksRef = collection(db, "books")
    const snapshot = await getDocs(textbooksRef)
    console.log("全教科書数:", snapshot.docs.length)
    
    let updatedCount = 0
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data()
      
      // statusフィールドが未設定またはnullの場合
      if (data.status === undefined || data.status === null) {
        console.log(`教科書 ${docSnapshot.id} (${data.title || '不明'}) のstatusを更新中...`)
        
        await setDoc(doc(db, "books", docSnapshot.id), {
          status: 'available'
        }, { merge: true })
        
        updatedCount++
        console.log(`教科書 ${docSnapshot.id} のstatusを'available'に更新しました`)
      }
    }
    
    console.log(`statusフィールドの更新完了: ${updatedCount}件の教科書を更新しました`)
  } catch (error) {
    console.error("statusフィールド更新失敗:", error)
    throw error
  }
}
