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

/**
 * 画像リサイズ・圧縮のオプション
 */
export interface ImageResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0.1 - 1.0
  maxSizeKB?: number // 最大ファイルサイズ（KB）
}

const DEFAULT_OPTIONS: Required<ImageResizeOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeKB: 500 // 500KB
}

/**
 * 画像ファイルをリサイズし、圧縮する
 */
export async function resizeImage(
  file: File,
  options: ImageResizeOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }
    
    img.onload = () => {
      try {
        // 元の画像サイズ
        const { width: originalWidth, height: originalHeight } = img
        
        // リサイズ後のサイズを計算
        const { width: newWidth, height: newHeight } = calculateNewDimensions(
          originalWidth,
          originalHeight,
          opts.maxWidth,
          opts.maxHeight
        )
        
        // Canvasサイズを設定
        canvas.width = newWidth
        canvas.height = newHeight
        
        // 高品質な描画設定
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        // 品質を調整しながらファイルサイズを最適化
        compressToTargetSize(canvas, file.name, opts.quality, opts.maxSizeKB)
          .then(resolve)
          .catch(reject)
          
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    // 画像を読み込み
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * アスペクト比を保持しながら新しいサイズを計算
 */
function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let newWidth = originalWidth
  let newHeight = originalHeight
  
  // 幅が最大値を超える場合
  if (newWidth > maxWidth) {
    newHeight = (newHeight * maxWidth) / newWidth
    newWidth = maxWidth
  }
  
  // 高さが最大値を超える場合
  if (newHeight > maxHeight) {
    newWidth = (newWidth * maxHeight) / newHeight
    newHeight = maxHeight
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  }
}

/**
 * 目標ファイルサイズになるまで品質を調整して圧縮
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  fileName: string,
  initialQuality: number,
  maxSizeKB: number
): Promise<File> {
  let quality = initialQuality
  let attempt = 0
  const maxAttempts = 10
  
  while (attempt < maxAttempts) {
    const blob = await canvasToBlob(canvas, quality)
    const sizeKB = blob.size / 1024
    
    console.log(`圧縮試行 ${attempt + 1}: 品質=${quality.toFixed(2)}, サイズ=${sizeKB.toFixed(1)}KB`)
    
    if (sizeKB <= maxSizeKB || quality <= 0.1) {
      // 目標サイズに達したか、品質が最低値に達した場合
      return new File([blob], fileName, { type: blob.type })
    }
    
    // 品質を段階的に下げる
    if (sizeKB > maxSizeKB * 2) {
      quality *= 0.7 // 大幅に下げる
    } else if (sizeKB > maxSizeKB * 1.5) {
      quality *= 0.8 // 中程度に下げる
    } else {
      quality *= 0.9 // 少し下げる
    }
    
    quality = Math.max(0.1, quality) // 最低品質を0.1に制限
    attempt++
  }
  
  // 最終的な結果を返す
  const finalBlob = await canvasToBlob(canvas, quality)
  return new File([finalBlob], fileName, { type: finalBlob.type })
}

/**
 * CanvasをBlobに変換
 */
function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * ファイルサイズを読みやすい形式で表示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 画像ファイルかどうかを判定
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 対応している画像形式かどうかを判定
 */
export function isSupportedImageType(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
  return supportedTypes.includes(file.type)
}

/**
 * 複数の画像を一括でリサイズ
 */
export async function resizeMultipleImages(
  files: File[],
  options: ImageResizeOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> {
  const results: File[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    if (!isImageFile(file)) {
      console.warn(`ファイル ${file.name} は画像ファイルではありません`)
      results.push(file) // 画像以外はそのまま追加
      continue
    }
    
    if (!isSupportedImageType(file)) {
      console.warn(`ファイル ${file.name} はサポートされていない形式です`)
      results.push(file) // サポート外の形式はそのまま追加
      continue
    }
    
    try {
      console.log(`画像リサイズ開始: ${file.name} (${formatFileSize(file.size)})`)
      const resizedFile = await resizeImage(file, options)
      console.log(`画像リサイズ完了: ${resizedFile.name} (${formatFileSize(resizedFile.size)})`)
      results.push(resizedFile)
    } catch (error) {
      console.error(`画像リサイズエラー (${file.name}):`, error)
      results.push(file) // エラーの場合は元ファイルを使用
    }
    
    // 進捗を報告
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
  }
  
  return results
}