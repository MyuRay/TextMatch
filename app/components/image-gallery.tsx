"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
        <Image
          src="/placeholder.svg"
          alt={title}
          fill
          className="object-contain"
          style={{ objectFit: 'contain' }}
        />
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-4">
      {/* メイン画像 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
        <Image
          src={images[currentIndex]}
          alt={`${title} - 画像 ${currentIndex + 1}`}
          fill
          className="object-contain"
          style={{ objectFit: 'contain' }}
          priority
        />
        
        {/* ナビゲーションボタン */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* ページインジケータ */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* サムネイル */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden bg-muted flex items-center justify-center ${
                index === currentIndex ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <Image
                src={image}
                alt={`${title} - サムネイル ${index + 1}`}
                fill
                className="object-contain"
                style={{ objectFit: 'contain' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}