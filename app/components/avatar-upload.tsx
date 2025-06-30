"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, X, Loader2 } from "lucide-react"
import { compressImage, formatFileSize } from "@/lib/imageCompression"

interface AvatarUploadProps {
  avatarFile: File | null
  setAvatarFile: (file: File | null) => void
  userName?: string
}

export function AvatarUpload({ avatarFile, setAvatarFile, userName }: AvatarUploadProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionMessage, setCompressionMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      await processImageFile(file)
    }
  }

  const processImageFile = async (file: File) => {
    try {
      // 画像ファイルかチェック
      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください")
        return
      }

      setIsCompressing(true)
      setCompressionMessage(null)

      const originalSizeMB = file.size / (1024 * 1024)
      const maxSizeMB = 1 // 1MB制限

      if (originalSizeMB > maxSizeMB) {
        // 圧縮が必要
        setCompressionMessage(`画像を圧縮しています... (${formatFileSize(file.size)} → 1MB以下)`)
        
        try {
          const compressedFile = await compressImage(file, {
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: 800,
            quality: 0.8,
            outputFormat: 'image/jpeg'
          })

          const compressedSizeMB = compressedFile.size / (1024 * 1024)
          setCompressionMessage(
            `✓ 圧縮完了: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`
          )
          
          setAvatarFile(compressedFile)
          
          // 3秒後にメッセージを消す
          setTimeout(() => setCompressionMessage(null), 3000)
        } catch (error) {
          console.error('画像圧縮エラー:', error)
          alert("画像の圧縮に失敗しました。別の画像を選択してください。")
        }
      } else {
        // 圧縮不要
        setAvatarFile(file)
      }
    } catch (error) {
      console.error('画像処理エラー:', error)
      alert("画像の処理中にエラーが発生しました")
    } finally {
      setIsCompressing(false)
    }
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
    
    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type.startsWith("image/")) {
      await processImageFile(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {/* アバター表示エリア */}
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarPreview || undefined} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          {avatarPreview && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeAvatar}
              type="button"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* アップロードエリア */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
          } ${isCompressing ? "pointer-events-none opacity-50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isCompressing && document.getElementById("avatar-upload")?.click()}
        >
          {isCompressing ? (
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
          ) : (
            <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          )}
          <div className="text-sm text-gray-600 mb-1">
            {isCompressing ? "画像を処理中..." : avatarPreview ? "画像を変更" : "プロフィール画像を選択"}
          </div>
          <div className="text-xs text-gray-500">
            {isCompressing ? "しばらくお待ちください" : "ドラッグ&ドロップ または クリックして選択"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            JPG, PNG (1MBを超える場合は自動圧縮)
          </div>
        </div>

        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {avatarPreview && !isCompressing && (
        <div className="text-center">
          <p className="text-xs text-green-600 font-medium">
            ✓ プロフィール画像が設定されました
          </p>
        </div>
      )}

      {compressionMessage && (
        <div className="text-center">
          <p className="text-xs text-blue-600 font-medium">
            {compressionMessage}
          </p>
        </div>
      )}
    </div>
  )
}