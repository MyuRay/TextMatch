"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => {
    const fetchBooks = async () => {
      const latest = await getTextbooks()
      const all = await getAllTextbooks()
      setLatestBooks(latest)
      setAllBooks(all)
    }
    fetchBooks()
  }, [])

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
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">キャンパスで教科書を手渡そう</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              オンライン✕オフライン 学生のためのフリーマーケット
            </p>

            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto mb-10">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="タイトル、著者、大学名で検索..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" type="submit">検索</Button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <Button size="lg" className="h-14" asChild>
                <Link href="/marketplace">出品一覧を見る</Link>
              </Button>
              <Button size="lg" className="h-14" variant="outline" asChild>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestBooks.map((book) => (
                <Card key={book.id} className="overflow-hidden transition-all hover:shadow-md">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Image
                      src={book.imageUrl || "/placeholder.svg"}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
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

        <HowItWorksSection />
        <CallToActionSection />
        {!user && <AuthCTASection />}
      </main>

      <Footer />
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">利用方法</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {["教科書を出品", "メッセージで連絡", "キャンパスで取引"].map((title, i) => (
            <div className="text-center" key={i}>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-xl">{i + 1}</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground">
                {
                  ["使わなくなった教科書の情報と写真をアップロードします",
                   "興味のある教科書の出品者とメッセージでやり取りします",
                   "キャンパス内の指定場所で教科書を引き渡します"][i]
                }
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button size="lg" asChild>
            <Link href="/register">今すぐ登録する</Link>
          </Button>
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
