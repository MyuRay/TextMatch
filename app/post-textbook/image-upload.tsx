"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { X } from "lucide-react"

interface ImageUploadProps {
  image: File | null
  setImage: (file: File | null) => void
  imagePreview: string | null
  setImagePreview: (preview: string | null) => void
}

export function ImageUpload({ image, setImage, imagePreview, setImagePreview }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  return (
    <div className="space-y-4">
      {!imagePreview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-sm text-muted-foreground">Drag and drop an image, or click to browse</div>
            <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <Button variant="outline" onClick={() => document.getElementById("image-upload")?.click()} type="button">
              Select Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image src={imagePreview || "/placeholder.svg"} alt="Textbook preview" fill className="object-cover" />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
            onClick={removeImage}
            type="button"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </Button>
        </div>
      )}
    </div>
  )
}
