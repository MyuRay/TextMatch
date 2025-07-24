/**
 * 管理者ユーティリティ
 */

import { UserProfile } from "./firestore"

/**
 * ユーザーが管理者かどうかを確認
 */
export function isAdmin(userProfile: UserProfile | null): boolean {
  return userProfile?.isOfficial === true && userProfile?.officialType === 'admin'
}

/**
 * ユーザーがサポート権限を持つかどうかを確認
 */
export function isSupport(userProfile: UserProfile | null): boolean {
  return userProfile?.isOfficial === true && 
         (userProfile?.officialType === 'admin' || userProfile?.officialType === 'support')
}

/**
 * ユーザーが何らかの公式権限を持つかどうかを確認
 */
export function isOfficial(userProfile: UserProfile | null): boolean {
  return userProfile?.isOfficial === true
}

/**
 * 管理者レベルを取得
 */
export function getAdminLevel(userProfile: UserProfile | null): number {
  if (!userProfile?.isOfficial) return 0
  
  switch (userProfile.officialType) {
    case 'admin': return 3
    case 'support': return 2
    case 'team': return 1
    default: return 0
  }
}

/**
 * 管理者権限が必要なページのアクセス制御
 */
export function requireAdmin(userProfile: UserProfile | null): boolean {
  if (!isAdmin(userProfile)) {
    throw new Error('管理者権限が必要です')
  }
  return true
}

/**
 * サポート権限が必要なページのアクセス制御  
 */
export function requireSupport(userProfile: UserProfile | null): boolean {
  if (!isSupport(userProfile)) {
    throw new Error('サポート権限が必要です')
  }
  return true
}