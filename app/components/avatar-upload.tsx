"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, X } from "lucide-react"

interface AvatarUploadProps {
  avatarFile: File | null
  setAvatarFile: (file: File | null) => void
  userName?: string
}

export function AvatarUpload({ avatarFile, setAvatarFile, userName }: AvatarUploadProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      // 画像ファイルかチェック
      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください")
        return
      }
      
      // ファイルサイズチェック (5MB制限)
      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズは5MB以下にしてください")
        return
      }
      
      setAvatarFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0] || null
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズは5MB以下にしてください")
        return
      }
      setAvatarFile(file)
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
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("avatar-upload")?.click()}
        >
          <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <div className="text-sm text-gray-600 mb-1">
            {avatarPreview ? "画像を変更" : "プロフィール画像を選択"}
          </div>
          <div className="text-xs text-gray-500">
            ドラッグ&ドロップ または クリックして選択
          </div>
          <div className="text-xs text-gray-400 mt-1">
            JPG, PNG (最大5MB)
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

      {avatarPreview && (
        <div className="text-center">
          <p className="text-xs text-green-600 font-medium">
            ✓ プロフィール画像が設定されました
          </p>
        </div>
      )}
    </div>
  )
}