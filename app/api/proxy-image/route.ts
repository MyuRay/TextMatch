import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // URLデコード
    const decodedUrl = decodeURIComponent(imageUrl)
    console.log('プロキシ画像取得:', decodedUrl)

    // 画像を取得
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://books.google.com',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      // タイムアウト設定
      signal: AbortSignal.timeout(10000), // 10秒でタイムアウト
    })

    if (!response.ok) {
      console.error('画像取得失敗:', response.status, response.statusText)
      return NextResponse.json({ error: `Failed to fetch image: ${response.status}` }, { status: response.status })
    }

    // Content-Typeを確認
    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'URL does not point to an image' }, { status: 400 })
    }

    // 画像データを取得
    const imageBuffer = await response.arrayBuffer()
    
    // レスポンスヘッダーを設定
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // 1日キャッシュ
      'Access-Control-Allow-Origin': '*',
    })

    return new NextResponse(imageBuffer, { headers })

  } catch (error) {
    console.error('プロキシ画像取得エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}