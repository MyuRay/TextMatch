/**
 * 管理者認証ミドルウェア
 */

import { User } from "firebase/auth"
import { getUserProfile } from "./firestore"

/**
 * ユーザーが管理者かどうかをチェック
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false
  
  try {
    const profile = await getUserProfile(user.uid)
    return profile?.isOfficial === true && profile?.officialType === 'admin'
  } catch (error) {
    console.error("管理者権限チェックエラー:", error)
    return false
  }
}

/**
 * 管理者権限をチェックして、権限がなければエラーを投げる
 */
export async function requireAdmin(user: User | null): Promise<void> {
  const adminCheck = await isAdmin(user)
  if (!adminCheck) {
    throw new Error("管理者権限が必要です")
  }
}

/**
 * 管理者用のカスタムフック
 */
export function useAdminAuth() {
  // これは後でuseAuthと組み合わせて実装
  return {
    isAdmin: false,
    isLoading: true
  }
}