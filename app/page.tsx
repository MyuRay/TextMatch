"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "./components/header"
import { Footer } from "./components/footer"
import { getTextbooks, getAllTextbooks, Textbook } from "@/lib/firestore"
import { useAuth } from "@/lib/useAuth"

export default function HomePage() {
  const [latestBooks, setLatestBooks] = useState<Textbook[]>([])
  const [allBooks, setAllBooks] = useState<Textbook[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchBooks = async () => {
      const latest = await getTextbooks()
      const all = await getAllTextbooks()
      setLatestBooks(latest)
      setAllBooks(all)
    }
    fetchBooks()
  }, [])

  // 自動スクロール機能
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer || latestBooks.length === 0) return

    let isScrolling = true
    let scrollPosition = 0
    const scrollSpeed = 0.9 // ピクセル/フレーム
    const cardWidth = 256 + 16 // カード幅 + gap
    const maxScroll = cardWidth * latestBooks.length

    const autoScroll = () => {
      if (!isScrolling) return

      scrollPosition += scrollSpeed
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0
      }
      
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollPosition
      }
      
      requestAnimationFrame(autoScroll)
    }

    const animation = requestAnimationFrame(autoScroll)

    // ホバー時は停止
    const handleMouseEnter = () => { isScrolling = false }
    const handleMouseLeave = () => { isScrolling = true }

    scrollContainer.addEventListener('mouseenter', handleMouseEnter)
    scrollContainer.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animation)
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter)
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [latestBooks])

  const filteredBooks = allBooks.filter((book) => {
    const query = searchQuery.toLowerCase()
    return (
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query) ||
      book.university?.toLowerCase().includes(query)
    )
  })

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/marketplace?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main>
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6">キャンパスで教科書を手渡そう</h1>
            <p className="text-sm md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
              オンライン✕オフライン 学生のためのフリーマーケット
            </p>

            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 md:gap-4 max-w-lg mx-auto mb-6 md:mb-10">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="タイトル、著者、大学名で検索..."
                  className="pl-10 h-10 md:h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="default" className="md:size-lg" type="submit">検索</Button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-lg mx-auto">
              <Button size="default" className="h-12 md:h-14 md:size-lg" asChild>
                <Link href="/marketplace">出品一覧を見る</Link>
              </Button>
              <Button size="default" className="h-12 md:h-14 md:size-lg" variant="outline" asChild>
                <Link href="/post-textbook">教科書を出品する</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">新着教科書</h2>
              <Button variant="outline" asChild>
                <Link href="/marketplace">すべて見る</Link>
              </Button>
            </div>
            {/* モバイル: 横スクロール、デスクトップ: グリッド */}
            <div className="md:hidden">
              <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollBehavior: 'auto' }}
              >
                {/* 最初のセット */}
                {latestBooks.map((book) => (
                  <Card key={book.id} className="flex-none w-64 overflow-hidden transition-all hover:shadow-md">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                      <Image
                        src={(book.imageUrls && book.imageUrls[0]) || book.imageUrl || "/placeholder.svg"}
                        alt={book.title}
                        fill
                        className="object-contain"
                        style={{ objectFit: 'contain' }}
                      />
                      {/* 複数画像インジケータ */}
                      {book.imageUrls && book.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          +{book.imageUrls.length - 1}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-muted-foreground">{book.author || "著者不明"}</p>
                      <p className="text-xs text-blue-700 font-medium">
                        <Link href={`/marketplace?university=${encodeURIComponent(book.university || "")}`}>
                          {book.university || "大学名不明"}
                        </Link>
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold text-sm text-gray-800">¥{book.price?.toLocaleString?.()}</p>
                        <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-6" asChild>
                          <Link href={`/marketplace/${book.id}`}>詳細</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* 複製されたセット（無限スクロール用） */}
                {latestBooks.map((book) => (
                  <Card key={`duplicate-${book.id}`} className="flex-none w-64 overflow-hidden transition-all hover:shadow-md">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                      <Image
                        src={(book.imageUrls && book.imageUrls[0]) || book.imageUrl || "/placeholder.svg"}
                        alt={book.title}
                        fill
                        className="object-contain"
                        style={{ objectFit: 'contain' }}
                      />
                      {/* 複数画像インジケータ */}
                      {book.imageUrls && book.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          +{book.imageUrls.length - 1}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-muted-foreground">{book.author || "著者不明"}</p>
                      <p className="text-xs text-blue-700 font-medium">
                        <Link href={`/marketplace?university=${encodeURIComponent(book.university || "")}`}>
                          {book.university || "大学名不明"}
                        </Link>
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold text-sm text-gray-800">¥{book.price?.toLocaleString?.()}</p>
                        <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-6" asChild>
                          <Link href={`/marketplace/${book.id}`}>詳細</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* デスクトップ: グリッド */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestBooks.map((book) => (
                <Card key={book.id} className="overflow-hidden transition-all hover:shadow-md">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
                    <Image
                      src={(book.imageUrls && book.imageUrls[0]) || book.imageUrl || "/placeholder.svg"}
                      alt={book.title}
                      fill
                      className="object-contain"
                      style={{ objectFit: 'contain' }}
                    />
                    {/* 複数画像インジケータ */}
                    {book.imageUrls && book.imageUrls.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        +{book.imageUrls.length - 1}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-base leading-snug line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author || "著者不明"}</p>
                    <p className="text-xs text-blue-700 font-medium">
                      <Link href={`/marketplace?university=${encodeURIComponent(book.university || "")}`}>
                        {book.university || "大学名不明"}
                      </Link>
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-lg text-gray-800">¥{book.price?.toLocaleString?.()}</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/marketplace/${book.id}`}>詳細を見る</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <HowItWorksSection user={user} />
        <SponsorSection />
        <CallToActionSection />
        {!user && <AuthCTASection />}
      </main>

      <Footer />
    </div>
  )
}

function HowItWorksSection({ user }: { user: any }) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">利用方法</h2>
        
        {/* 全デバイス共通: 3列グリッド（モバイルでサイズ調整） */}
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {["教科書を出品", "メッセージで連絡", "キャンパスで取引"].map((title, i) => (
            <div className="text-center" key={i}>
              <div className="bg-primary/10 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                <span className="text-primary font-bold text-lg md:text-xl">{i + 1}</span>
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2">{title}</h3>
              <p className="text-muted-foreground text-xs md:text-base">
                {
                  ["使わなくなった教科書の情報と写真をアップロードします",
                   "興味のある教科書の出品者とメッセージでやり取りします",
                   "キャンパス内の指定場所で教科書を引き渡します"][i]
                }
              </p>
            </div>
          ))}
        </div>
        
        {!user && (
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/register">今すぐ登録する</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function SponsorSection() {
  const sponsors = [
    {
      name: "千葉工業大学デジタル変革科学化高木研究室",
      logo: "/sponsors/takagilab_high_colored.png",
      url: "https://digitalx.one/professors/"
    },
    {
      name: "W3T",
      logo: "/sponsors/icon_w3club.png", 
      url: ""
    }
  ]

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">協賛企業・団体</h2>
          <p className="text-gray-600 text-sm md:text-base">
            TextMatchをご支援いただいている企業・団体の皆様
          </p>
        </div>
        
        {/* 全デバイス共通: 2列中央配置 */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-6 md:gap-12 max-w-lg">
            {sponsors.map((sponsor, index) => (
              <div
                key={index}
                className="bg-black rounded-lg shadow-lg border border-gray-800 h-20 md:h-28 w-36 md:w-48 flex items-center justify-center p-2 md:p-3 hover:bg-gray-900 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => sponsor.url && window.open(sponsor.url, '_blank')}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={120}
                    height={60}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // 画像読み込みエラー時はテキストを表示
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-white text-xs text-center">${sponsor.name}</span>`;
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            協賛に関するお問い合わせは{" "}
            <Link href="/contact" className="text-primary hover:underline">
              こちら
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

function CallToActionSection() {
  return (
    <section className="py-12 md:py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">今すぐ教科書を出品しませんか？</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
          使わなくなった教科書を出品して、必要としている学生に手渡しましょう
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/post-textbook">教科書を出品する</Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-primary/20 hover:bg-primary/30 border-white" asChild>
            <Link href="/marketplace">教科書を探す</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function AuthCTASection() {
  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-6">アカウントをお持ちですか？</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button size="lg" className="flex-1" asChild>
            <Link href="/login">ログイン</Link>
          </Button>
          <Button size="lg" variant="outline" className="flex-1" asChild>
            <Link href="/register">新規登録</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
