import { db } from "./firebaseConfig"
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore"

export interface PageView {
  id?: string
  path: string
  userId?: string
  userAgent?: string
  timestamp: Timestamp
  sessionId: string
  referrer?: string
  university?: string
}

export interface AccessStats {
  totalPageViews: number
  uniqueVisitors: number
  topPages: {
    path: string
    views: number
  }[]
  hourlyStats: {
    hour: number
    views: number
  }[]
  dailyStats: {
    date: string
    views: number
    uniqueVisitors: number
  }[]
  universityStats: {
    university: string
    views: number
  }[]
}

/**
 * ページビューを記録
 */
export async function trackPageView(
  path: string,
  userId?: string,
  userUniversity?: string
): Promise<void> {
  try {
    // セッションIDを生成または取得
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = generateSessionId()
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    const pageView: Omit<PageView, 'id'> = {
      path,
      ...(userId && { userId }), // userIdがある場合のみ含める
      userAgent: navigator.userAgent,
      timestamp: Timestamp.now(),
      sessionId,
      ...(document.referrer && { referrer: document.referrer }), // referrerがある場合のみ含める
      ...(userUniversity && { university: userUniversity }) // universityがある場合のみ含める
    }

    await addDoc(collection(db, "page_views"), pageView)
    console.log(`ページビューを記録: ${path}`)
  } catch (error) {
    console.error("ページビュー記録エラー:", error)
    // エラーが発生してもユーザー体験を損なわないよう、エラーを投げない
  }
}

/**
 * セッションIDを生成
 */
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * アクセス統計を取得
 */
export async function getAccessStats(
  dateFrom?: Date,
  dateTo?: Date
): Promise<AccessStats> {
  try {
    console.log("アクセス統計取得開始...")
    
    const endDate = dateTo || new Date()
    const startDate = dateFrom || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7日前

    // 期間内のページビューを取得
    const pageViewsQuery = query(
      collection(db, "page_views"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate)),
      orderBy("timestamp", "desc")
    )

    const pageViewsSnapshot = await getDocs(pageViewsQuery)
    const pageViews = pageViewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PageView))

    console.log(`取得したページビュー数: ${pageViews.length}`)

    // 基本統計
    const totalPageViews = pageViews.length
    const uniqueVisitors = new Set(pageViews.map(pv => pv.sessionId)).size

    // ページ別アクセス数
    const pageViewCounts = new Map<string, number>()
    pageViews.forEach(pv => {
      pageViewCounts.set(pv.path, (pageViewCounts.get(pv.path) || 0) + 1)
    })

    const topPages = Array.from(pageViewCounts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // 時間別統計
    const hourlyViewCounts = new Map<number, number>()
    pageViews.forEach(pv => {
      const hour = pv.timestamp.toDate().getHours()
      hourlyViewCounts.set(hour, (hourlyViewCounts.get(hour) || 0) + 1)
    })

    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      views: hourlyViewCounts.get(hour) || 0
    }))

    // 日別統計
    const dailyStats = generateDailyAccessStats(pageViews, startDate, endDate)

    // 大学別統計
    const universityViewCounts = new Map<string, number>()
    pageViews.forEach(pv => {
      if (pv.university) {
        universityViewCounts.set(pv.university, (universityViewCounts.get(pv.university) || 0) + 1)
      }
    })

    const universityStats = Array.from(universityViewCounts.entries())
      .map(([university, views]) => ({ university, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    const stats: AccessStats = {
      totalPageViews,
      uniqueVisitors,
      topPages,
      hourlyStats,
      dailyStats,
      universityStats
    }

    console.log("アクセス統計取得完了:", stats)
    return stats
  } catch (error) {
    console.error("アクセス統計取得エラー:", error)
    throw error
  }
}

/**
 * 日別アクセス統計を生成
 */
function generateDailyAccessStats(pageViews: PageView[], startDate: Date, endDate: Date) {
  const dailyStats = []
  const currentDate = new Date(startDate)
  const seenSessionIds = new Set<string>() // 過去に見たセッションIDを記録

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayStart = new Date(currentDate)
    const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)

    // その日のページビュー
    const dayPageViews = pageViews.filter(pv => {
      const pvDate = pv.timestamp.toDate()
      return pvDate >= dayStart && pvDate < dayEnd
    })

    // その日のセッションID一覧を取得
    const daySessionIds = new Set(dayPageViews.map(pv => pv.sessionId))
    
    // その日に初めて訪問したユニーク訪問者数（新規ユニーク訪問者）
    let newUniqueVisitors = 0
    daySessionIds.forEach(sessionId => {
      if (!seenSessionIds.has(sessionId)) {
        newUniqueVisitors++
        seenSessionIds.add(sessionId)
      }
    })

    dailyStats.push({
      date: dateStr,
      views: dayPageViews.length,
      uniqueVisitors: newUniqueVisitors
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dailyStats
}

/**
 * 人気ページランキングを取得
 */
export async function getPopularPages(
  limit: number = 10,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{ path: string, views: number, title?: string }[]> {
  try {
    const endDate = dateTo || new Date()
    const startDate = dateFrom || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const pageViewsQuery = query(
      collection(db, "page_views"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate))
    )

    const pageViewsSnapshot = await getDocs(pageViewsQuery)
    const pageViews = pageViewsSnapshot.docs.map(doc => doc.data() as PageView)

    // ページ別集計
    const pageViewCounts = new Map<string, number>()
    pageViews.forEach(pv => {
      pageViewCounts.set(pv.path, (pageViewCounts.get(pv.path) || 0) + 1)
    })

    // ページタイトルを推測
    const getPageTitle = (path: string): string => {
      if (path === '/') return 'ホーム'
      if (path === '/marketplace') return 'マーケットプレイス'
      if (path === '/login') return 'ログイン'
      if (path === '/register') return '新規登録'
      if (path === '/mypage') return 'マイページ'
      if (path === '/post-textbook') return '教科書出品'
      if (path.startsWith('/marketplace/')) return '教科書詳細'
      if (path.startsWith('/messages/')) return 'メッセージ'
      if (path.startsWith('/admin/')) return '管理画面'
      return path
    }

    return Array.from(pageViewCounts.entries())
      .map(([path, views]) => ({
        path,
        views,
        title: getPageTitle(path)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  } catch (error) {
    console.error("人気ページ取得エラー:", error)
    throw error
  }
}

/**
 * リアルタイムアクティブユーザー数を取得
 */
export async function getActiveUsers(): Promise<number> {
  try {
    // 過去5分間のページビューを取得
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentPageViewsQuery = query(
      collection(db, "page_views"),
      where("timestamp", ">=", Timestamp.fromDate(fiveMinutesAgo))
    )

    const recentPageViewsSnapshot = await getDocs(recentPageViewsQuery)
    const recentPageViews = recentPageViewsSnapshot.docs.map(doc => doc.data() as PageView)

    // ユニークセッション数を計算
    const uniqueSessions = new Set(recentPageViews.map(pv => pv.sessionId))
    
    return uniqueSessions.size
  } catch (error) {
    console.error("アクティブユーザー数取得エラー:", error)
    return 0
  }
}

/**
 * コンバージョン率を計算
 */
export async function getConversionRate(dateFrom?: Date, dateTo?: Date): Promise<{
  registrationRate: number // 訪問者のうち登録した人の割合
  listingRate: number // 登録者のうち出品した人の割合
  purchaseRate: number // 訪問者のうち購入した人の割合
}> {
  try {
    const endDate = dateTo || new Date()
    const startDate = dateFrom || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // ページビュー数（ユニークビジター）
    const pageViewsQuery = query(
      collection(db, "page_views"),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate))
    )
    const pageViewsSnapshot = await getDocs(pageViewsQuery)
    const uniqueVisitors = new Set(pageViewsSnapshot.docs.map(doc => doc.data().sessionId)).size

    // 新規登録数（簡易計算として、期間内のページビューでuserIdが存在するもの）
    const registrations = pageViewsSnapshot.docs.filter(doc => doc.data().userId).length

    // 出品数（/post-textbookページのアクセス）
    const listingPageViews = pageViewsSnapshot.docs.filter(doc => 
      doc.data().path === '/post-textbook'
    ).length

    // 購入数（簡易計算として、教科書詳細ページのアクセス）
    const purchasePageViews = pageViewsSnapshot.docs.filter(doc => 
      doc.data().path.startsWith('/marketplace/')
    ).length

    return {
      registrationRate: uniqueVisitors > 0 ? (registrations / uniqueVisitors) * 100 : 0,
      listingRate: registrations > 0 ? (listingPageViews / registrations) * 100 : 0,
      purchaseRate: uniqueVisitors > 0 ? (purchasePageViews / uniqueVisitors) * 100 : 0
    }
  } catch (error) {
    console.error("コンバージョン率計算エラー:", error)
    return { registrationRate: 0, listingRate: 0, purchaseRate: 0 }
  }
}