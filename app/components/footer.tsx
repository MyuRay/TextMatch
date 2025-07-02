import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-auto border-t py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <p className="font-bold text-lg">TextMatch</p>
            <p className="text-sm text-muted-foreground">学生のためのフリーマーケット</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-center">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              利用規約
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              プライバシーポリシー
            </Link>
            <Link href="/legal" className="text-sm text-muted-foreground hover:text-foreground">
              特定商取引法に基づく表記
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              お問い合わせ
            </Link>
          </div>
        </div>
        <div className="mt-4 md:mt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TextMatch. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
