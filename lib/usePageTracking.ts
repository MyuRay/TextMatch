"use client"

import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { trackPageView } from './analytics'

/**
 * ページビュー追跡フック
 */
export function usePageTracking(pagePath?: string) {
  const { user, userProfile } = useAuth()

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return

    const path = pagePath || window.location.pathname
    
    // ページビューを記録
    trackPageView(
      path,
      user?.uid,
      userProfile?.university
    )
  }, [pagePath, user?.uid, userProfile?.university])
}