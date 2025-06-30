/**
 * 画像圧縮ユーティリティ
 */

interface CompressionOptions {
  maxSizeMB?: number // 最大ファイルサイズ (MB)
  maxWidthOrHeight?: number // 最大幅または高さ (px)
  quality?: number // 画質 (0-1)
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * 画像ファイルを圧縮する
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1, // デフォルト1MB
    maxWidthOrHeight = 800, // デフォルト800px
    quality = 0.8, // デフォルト80%
    outputFormat = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // 元の画像サイズ
        let { width, height } = img

        // リサイズ計算
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          } else {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        // Canvasサイズ設定
        canvas.width = width
        canvas.height = height

        // 画像をCanvasに描画
        ctx?.drawImage(img, 0, 0, width, height)

        // 圧縮してBlobに変換
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('画像の圧縮に失敗しました'))
              return
            }

            // ファイルサイズチェック
            const compressedSizeMB = blob.size / (1024 * 1024)
            
            if (compressedSizeMB <= maxSizeMB) {
              // 圧縮成功
              const compressedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              // さらに品質を下げて再圧縮
              const lowerQuality = Math.max(0.1, quality - 0.1)
              if (lowerQuality < quality) {
                canvas.toBlob(
                  (secondBlob) => {
                    if (!secondBlob) {
                      reject(new Error('画像の圧縮に失敗しました'))
                      return
                    }
                    const finalFile = new File([secondBlob], file.name, {
                      type: outputFormat,
                      lastModified: Date.now()
                    })
                    resolve(finalFile)
                  },
                  outputFormat,
                  lowerQuality
                )
              } else {
                // これ以上圧縮できない場合はそのまま返す
                const finalFile = new File([blob], file.name, {
                  type: outputFormat,
                  lastModified: Date.now()
                })
                resolve(finalFile)
              }
            }
          },
          outputFormat,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'))
    }

    // 画像を読み込み
    img.src = URL.createObjectURL(file)
  })
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}