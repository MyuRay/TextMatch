import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function TextbookCard({ textbook }: { textbook: any }) {
  const isSold = textbook.status === 'sold'
  const isReserved = textbook.status === 'reserved'
  
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${isSold ? 'opacity-75' : ''}`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
        <Image
          src={(textbook.imageUrls && textbook.imageUrls[0]) || textbook.imageUrl || "/placeholder.svg"}
          alt={textbook.title}
          fill
          className={`object-contain ${isSold ? 'grayscale' : ''}`}
          style={{ objectFit: 'contain' }}
        />
        {/* 複数画像インジケータ */}
        {textbook.imageUrls && textbook.imageUrls.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            +{textbook.imageUrls.length - 1}
          </div>
        )}
        {/* 取引状態バッジ */}
        {(isSold || isReserved) && (
          <div className="absolute top-2 right-2">
            <Badge 
              variant={isSold ? 'destructive' : 'secondary'}
              className="shadow-md"
            >
              {isSold ? '売切' : '予約済'}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* タイトル */}
          <h3 className="font-semibold line-clamp-2 h-12">{textbook.title}</h3>

          {/* 著者と大学名 */}
          <div className="text-sm text-muted-foreground space-y-1">
            {textbook.author && <p>{textbook.author}</p>}
            {textbook.university && (
              <p>
                {" "}
                <Link
                  href={`/marketplace?university=${encodeURIComponent(textbook.university)}`}
                  className="text-blue-600 hover:underline"
                >
                  {textbook.university}
                </Link>
              </p>
            )}
          </div>

          {/* 価格 */}
          <div className="flex items-center justify-between mt-2">
            <p className={`font-medium text-lg ${isSold ? 'line-through text-muted-foreground' : ''}`}>
              ¥{textbook.price?.toLocaleString()}
            </p>
            {isSold && (
              <Badge variant="destructive" className="text-xs">
                売切済
              </Badge>
            )}
          </div>

          {/* 詳細ボタン */}
          <Button 
            className="w-full mt-2" 
            variant={isSold ? "secondary" : "outline"} 
            size="sm" 
            asChild
            disabled={isSold}
          >
            <Link href={`/marketplace/${textbook.id}`}>
              {isSold ? '売切済' : '詳細を見る'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
