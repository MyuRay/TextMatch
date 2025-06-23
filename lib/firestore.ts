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
}

export interface UserProfile {
  fullName: string
  email: string
  studentId: string
  university: string
  department?: string
  nickname?: string
  avatarUrl?: string
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

// ✅ ユーザーの詳細情報取得（ニックネーム+アバター）
export const getUserProfile = async (userId: string): Promise<{name: string, avatarUrl?: string} | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        name: data.nickname || data.fullName || "名無し",
        avatarUrl: data.avatarUrl
      }
    } else {
      return { name: "不明なユーザー" }
    }
  } catch (error) {
    console.error("ユーザープロフィール取得失敗:", error)
    return { name: "取得エラー" }
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
  } catch (error) {
    console.error("教科書状態更新失敗:", error)
    throw error
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
    const q = query(
      textbooksRef,
      where("userId", "==", userId)
    )
    const snapshot = await getDocs(q)
    console.log("出品中教科書ドキュメント数:", snapshot.docs.length)
    
    const sellingBooks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Textbook[]
    
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
