import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">ページが見つかりません</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            お探しのページは存在しないか、移動または削除された可能性があります。
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild>
            <Link href="/">
              ホームに戻る
            </Link>
          </Button>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                教科書を探す
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/post-textbook">
                教科書を出品
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-400">
          <p>問題が続く場合は、サポートまでお問い合わせください。</p>
        </div>
      </div>
    </div>
  )
}