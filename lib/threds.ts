// lib/thread.ts

import { db } from "@/lib/firebaseConfig"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore"

// Firestore上で、二人のユーザーのスレッドを取得 or 作成
export async function getOrCreateThread(userA: string, userB: string): Promise<string> {
  const participants = [userA, userB].sort() // 安定順

  const threadsRef = collection(db, "threads")
  const q = query(threadsRef, where("participants", "==", participants))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    return snapshot.docs[0].id
  }

  const newThreadRef = await addDoc(threadsRef, {
    participants,
    createdAt: serverTimestamp()
  })

  return newThreadRef.id
}