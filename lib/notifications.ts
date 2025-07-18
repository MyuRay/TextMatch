/**
 * 通知管理ライブラリ
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore"
import { db } from "./firebaseConfig"

export interface Notification {
  id: string
  userId: string
  type: 'message' | 'transaction' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: Timestamp
  relatedId?: string // conversationId, bookId など
  actionUrl?: string // クリック時の遷移先
}

/**
 * 通知を作成する
 */
export async function createNotification(
  userId: string,
  type: 'message' | 'transaction' | 'system',
  title: string,
  message: string,
  relatedId?: string,
  actionUrl?: string
): Promise<string> {
  try {
    const notificationData = {
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      relatedId,
      actionUrl
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    console.log("通知作成完了:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("通知作成エラー:", error)
    throw error
  }
}

/**
 * ユーザーの通知一覧を取得する
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[]
  } catch (error) {
    console.error("通知取得エラー:", error)
    return []
  }
}

/**
 * 未読通知数を取得する
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.length
  } catch (error) {
    console.error("未読通知数取得エラー:", error)
    return 0
  }
}

/**
 * 通知をリアルタイムで監視する
 */
export function subscribeToNotifications(
  userId: string, 
  callback: (notifications: Notification[]) => void
): () => void {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  )

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[]
    
    callback(notifications)
  }, (error) => {
    console.error("通知監視エラー:", error)
  })
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, {
      isRead: true
    })
  } catch (error) {
    console.error("通知既読更新エラー:", error)
    throw error
  }
}

/**
 * 複数の通知を既読にする
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  try {
    const updatePromises = notificationIds.map(id => 
      updateDoc(doc(db, "notifications", id), { isRead: true })
    )
    await Promise.all(updatePromises)
  } catch (error) {
    console.error("複数通知既読更新エラー:", error)
    throw error
  }
}

/**
 * ユーザーのすべての未読通知を既読にする
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    )
    
    const snapshot = await getDocs(q)
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    )
    
    await Promise.all(updatePromises)
    console.log(`${snapshot.docs.length}件の通知を既読にしました`)
  } catch (error) {
    console.error("全通知既読更新エラー:", error)
    throw error
  }
}

/**
 * 通知を削除する
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "notifications", notificationId))
  } catch (error) {
    console.error("通知削除エラー:", error)
    throw error
  }
}

/**
 * メッセージ通知を作成する
 */
export async function createMessageNotification(
  recipientId: string,
  senderName: string,
  bookTitle: string,
  conversationId: string
): Promise<void> {
  await createNotification(
    recipientId,
    'message',
    `${senderName}からメッセージ`,
    `「${bookTitle}」について新しいメッセージが届きました`,
    conversationId,
    `/messages/${conversationId}`
  )
}

/**
 * 取引成立通知を作成する
 */
export async function createTransactionNotification(
  recipientId: string,
  bookTitle: string,
  isForBuyer: boolean,
  conversationId: string
): Promise<void> {
  const title = isForBuyer ? "取引成立！" : "商品が売れました！"
  const message = isForBuyer 
    ? `「${bookTitle}」の取引が成立しました。商品を受け取ったら受取完了ボタンを押してください。`
    : `「${bookTitle}」が売れました。購入者と連絡を取り、商品をお渡しください。`

  await createNotification(
    recipientId,
    'transaction',
    title,
    message,
    conversationId,
    `/messages/${conversationId}`
  )
}

/**
 * 受取完了通知を作成する
 */
export async function createReceiptNotification(
  sellerId: string,
  bookTitle: string,
  buyerName: string,
  conversationId: string
): Promise<void> {
  await createNotification(
    sellerId,
    'transaction',
    "取引完了",
    `${buyerName}さんが「${bookTitle}」を受け取りました。取引完了です！`,
    conversationId,
    `/messages/${conversationId}`
  )
}

/**
 * 教科書再出品通知を作成する
 */
export async function createTextbookAvailableNotification(
  recipientId: string,
  bookTitle: string,
  bookId: string
): Promise<void> {
  await createNotification(
    recipientId,
    'system',
    "教科書が再出品されました",
    `「${bookTitle}」が再び購入可能になりました。`,
    bookId,
    `/marketplace/${bookId}`
  )
}