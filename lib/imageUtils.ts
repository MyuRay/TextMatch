// 画像URLからFileオブジェクトを作成する関数
export const fetchImageAsFile = async (imageUrl: string, fileName: string): Promise<File> => {
  try {
    console.log("画像取得開始:", imageUrl)
    
    // プロキシAPIを経由して画像を取得
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    console.log("プロキシURL:", proxyUrl)
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`画像の取得に失敗しました: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    
    // 画像形式を確認
    if (!blob.type.startsWith('image/')) {
      throw new Error('取得したファイルが画像ではありません')
    }
    
    // ファイル名に拡張子を追加
    const extension = blob.type.split('/')[1] || 'jpg'
    const fullFileName = fileName.includes('.') ? fileName : `${fileName}.${extension}`
    
    const file = new File([blob], fullFileName, { type: blob.type })
    console.log("画像変換完了:", fullFileName, "サイズ:", file.size)
    
    return file
  } catch (error) {
    console.error("画像取得エラー:", error)
    throw error
  }
}

// データURLからFileオブジェクトを作成する関数
export const dataURLtoFile = (dataURL: string, filename: string): File => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}