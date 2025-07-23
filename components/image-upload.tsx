"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { X, Loader2 } from "lucide-react"
import { resizeMultipleImages, formatFileSize, isImageFile, isSupportedImageType } from "@/lib/imageUtils"

interface ImageUploadProps {
  images: File[]
  setImages: (files: File[]) => void
  coverImageUrl?: string // ISBN取得時の表紙画像URL
  onUseCoverImage?: () => void // 表紙画像使用ボタンのコールバック
}

export function ImageUpload({ images, setImages, coverImageUrl, onUseCoverImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processTotal, setProcessTotal] = useState(0)
  const maxImages = 5

  useEffect(() => {
    // 既存のプレビューURLをクリーンアップ
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    
    // 新しいプレビューURLを作成
    const newPreviews = images.map(file => URL.createObjectURL(file))
    setImagePreviews(newPreviews)

    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [images])

  const processImages = async (newFiles: File[]) => {
    if (newFiles.length === 0) return

    setIsProcessing(true)
    setProcessProgress(0)
    setProcessTotal(newFiles.length)

    try {
      // 画像ファイルのみをフィルタリング
      const imageFiles = newFiles.filter(file => {
        if (!isImageFile(file)) {
          console.warn(`${file.name} は画像ファイルではありません`)
          return false
        }
        if (!isSupportedImageType(file)) {
          console.warn(`${file.name} はサポートされていない形式です`)
          return false
        }
        return true
      })

      if (imageFiles.length === 0) {
        alert('有効な画像ファイルが見つかりませんでした')
        return
      }

      console.log(`${imageFiles.length}枚の画像を処理中...`)
      
      // 画像をリサイズ
      const resizedImages = await resizeMultipleImages(
        imageFiles,
        {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          maxSizeKB: 500
        },
        (completed, total) => {
          setProcessProgress(completed)
          setProcessTotal(total)
        }
      )

      // 既存の画像と新しい画像を結合
      setImages([...images, ...resizedImages])

      console.log('画像処理完了:', resizedImages)
    } catch (error) {
      console.error('画像処理エラー:', error)
      alert('画像の処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
      setProcessTotal(0)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (images.length + files.length > maxImages) {
      alert(`画像は最大${maxImages}枚まで選択できます`)
      return
    }
    
    await processImages(files)
    // input要素をリセット
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    
    if (images.length + files.length > maxImages) {
      alert(`画像は最大${maxImages}枚まで選択できます`)
      return
    }
    
    await processImages(files)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setImages(newImages)
  }

  return (
    <div className="space-y-4">
      {/* ISBN取得時の表紙画像プレビュー */}
      {coverImageUrl && images.length === 0 && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-28 flex-shrink-0 bg-gray-100 rounded border flex items-center justify-center">
              <Image 
                src={coverImageUrl} 
                alt="書籍表紙" 
                width={80} 
                height={112}
                className="w-full h-full object-contain rounded"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-2">ISBNから表紙画像を取得しました</p>
              <p className="text-xs text-blue-700 mb-3">この画像を商品画像として使用できます</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onUseCoverImage}
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  この表紙を使用
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(coverImageUrl, '_blank')}
                  type="button"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  画像を保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 画像処理中の表示 */}
      {isProcessing && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">
                画像を処理中... ({processProgress}/{processTotal})
              </div>
              <div className="text-xs text-blue-700 mt-1">
                画像を自動でリサイズ・圧縮しています
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processTotal > 0 ? (processProgress / processTotal) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 画像選択エリア */}
      {images.length < maxImages && !isProcessing && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-sm text-muted-foreground">
              画像を選択してください（{images.length}/{maxImages}枚）
            </div>
            <div className="text-xs text-muted-foreground">
              複数選択可能・ドラッグ&ドロップ対応・自動リサイズ
            </div>
            <div className="text-xs text-green-600 font-medium">
              最大500KB、1200×1200px に自動調整されます
            </div>
            <Input 
              id="image-upload" 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={handleImageChange} 
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById("image-upload")?.click()} 
              type="button"
              disabled={isProcessing}
            >
              画像を選択
            </Button>
          </div>
        </div>
      )}

      {/* 選択された画像一覧 */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">選択された画像 ({images.length}/{maxImages}枚)</h4>
            <div className="text-xs text-muted-foreground">最初の画像がメイン画像になります</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-100 flex items-center justify-center">
                  <Image
                    src={preview}
                    alt={`画像 ${index + 1}`}
                    fill
                    className="object-contain"
                    style={{ objectFit: 'contain' }}
                  />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      メイン
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                  {formatFileSize(images[index]?.size || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
