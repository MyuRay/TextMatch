"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { X, Upload, MoveUp, MoveDown, Loader2 } from "lucide-react"
import { resizeMultipleImages, formatFileSize, isImageFile, isSupportedImageType } from "@/lib/imageUtils"

interface EditImageUploadProps {
  existingImageUrls: string[]
  newImages: File[]
  setExistingImageUrls: (urls: string[]) => void
  setNewImages: (files: File[]) => void
}

export function EditImageUpload({ 
  existingImageUrls, 
  newImages, 
  setExistingImageUrls, 
  setNewImages 
}: EditImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processTotal, setProcessTotal] = useState(0)
  const maxImages = 5

  useEffect(() => {
    // 新規画像のプレビューURLをクリーンアップ
    newImagePreviews.forEach(url => URL.revokeObjectURL(url))
    
    // 新しいプレビューURLを作成
    const newPreviews = newImages.map(file => URL.createObjectURL(file))
    setNewImagePreviews(newPreviews)

    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [newImages])

  const getTotalImageCount = () => {
    return existingImageUrls.length + newImages.length
  }

  const processImages = async (files: File[]) => {
    if (files.length === 0) return

    setIsProcessing(true)
    setProcessProgress(0)
    setProcessTotal(files.length)

    try {
      // 画像ファイルのみをフィルタリング
      const imageFiles = files.filter(file => {
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

      // 既存の新規画像と処理済み画像を結合
      setNewImages([...newImages, ...resizedImages])

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
    
    if (getTotalImageCount() + files.length > maxImages) {
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
    
    if (getTotalImageCount() + files.length > maxImages) {
      alert(`画像は最大${maxImages}枚まで選択できます`)
      return
    }
    
    await processImages(files)
  }

  const removeExistingImage = (index: number) => {
    const newUrls = existingImageUrls.filter((_, i) => i !== index)
    setExistingImageUrls(newUrls)
  }

  const removeNewImage = (index: number) => {
    const newFiles = newImages.filter((_, i) => i !== index)
    setNewImages(newFiles)
  }

  const moveExistingImage = (fromIndex: number, toIndex: number) => {
    const newUrls = [...existingImageUrls]
    const [movedUrl] = newUrls.splice(fromIndex, 1)
    newUrls.splice(toIndex, 0, movedUrl)
    setExistingImageUrls(newUrls)
  }

  const moveNewImage = (fromIndex: number, toIndex: number) => {
    const newFiles = [...newImages]
    const [movedFile] = newFiles.splice(fromIndex, 1)
    newFiles.splice(toIndex, 0, movedFile)
    setNewImages(newFiles)
  }

  return (
    <div className="space-y-4">
      {/* 既存画像の表示 */}
      {existingImageUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">現在の画像</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {existingImageUrls.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {url ? (
                    <Image
                      src={url}
                      alt={`既存画像 ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      画像が見つかりません
                    </div>
                  )}
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveExistingImage(index, index - 1)}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                  )}
                  {index < existingImageUrls.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveExistingImage(index, index + 1)}
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => removeExistingImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新規画像の表示 */}
      {newImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">新しく追加する画像</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {newImages.map((file, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {newImagePreviews[index] ? (
                    <Image
                      src={newImagePreviews[index]}
                      alt={`新規画像 ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      読み込み中...
                    </div>
                  )}
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveNewImage(index, index - 1)}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                  )}
                  {index < newImages.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveNewImage(index, index + 1)}
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => removeNewImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 画像アップロード領域 */}
      {getTotalImageCount() < maxImages && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">画像を追加</h4>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              画像をドラッグ&ドロップまたはクリックして選択
            </p>
            <p className="text-xs text-gray-500 mb-4">
              最大{maxImages}枚まで (現在: {getTotalImageCount()}枚)
            </p>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              画像を選択
            </Button>
          </div>
        </div>
      )}

      {/* 情報メッセージ */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 最初の画像がメイン画像として使用されます</p>
        <p>• 画像の順序を変更するには、矢印ボタンを使用してください</p>
        <p>• 対応形式: JPG, PNG, WebP</p>
      </div>
    </div>
  )
}