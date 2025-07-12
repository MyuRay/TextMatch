"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ArrowUpDown, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextbookCard } from "./textbook-card"
import { getAllTextbooks, Textbook } from "@/lib/firestore"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
// import StripeConnectButton from "@/components/stripe-connect-button"
import { useAuth } from "@/lib/useAuth"

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const urlUniversity = searchParams.get("university") ?? ""
  const urlQuery = searchParams.get("query") ?? ""
  const { user, userProfile } = useAuth()

  const [searchQuery, setSearchQuery] = useState(urlQuery || urlUniversity)
  const [sortBy, setSortBy] = useState("newest")
  const [showSold, setShowSold] = useState(true)
  const [sameUniversityOnly, setSameUniversityOnly] = useState(false)
  const [genreFilter, setGenreFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [allTextbooks, setAllTextbooks] = useState<Textbook[]>([])
  const [filteredTextbooks, setFilteredTextbooks] = useState<Textbook[]>([])

  useEffect(() => {
    const fetchBooks = async () => {
      const books = await getAllTextbooks()
      setAllTextbooks(books)
    }
    fetchBooks()
  }, [])

  useEffect(() => {
    let filtered = [...allTextbooks]
    const keyword = searchQuery.toLowerCase()

    if (keyword) {
      filtered = filtered.filter(
        (book) =>
          book.title?.toLowerCase().includes(keyword) ||
          book.author?.toLowerCase().includes(keyword) ||
          book.university?.toLowerCase().includes(keyword)
      )
    }

    if (!showSold) {
      filtered = filtered.filter(book => book.status !== 'sold')
    }

    if (sameUniversityOnly && userProfile?.university) {
      filtered = filtered.filter(book => book.university === userProfile.university)
    }

    if (genreFilter !== "all") {
      filtered = filtered.filter(book => book.genre === genreFilter)
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter(book => book.condition === conditionFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0)
        case "price-high":
          return (b.price || 0) - (a.price || 0)
        case "newest":
        default:
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      }
    })

    setFilteredTextbooks(filtered)
  }, [searchQuery, allTextbooks, sortBy, showSold, sameUniversityOnly, genreFilter, conditionFilter, userProfile])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold">出品一覧</h1>
                  {/* {user && (
                    <StripeConnectButton />
                  )} */}
                </div>
              </div>
              
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="タイトル、著者、大学名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 w-full h-12 md:h-14 text-base"
                />
              </div>
            </div>

            {/* フィルター（折りたたみ可能） */}
            <div className="bg-card rounded-lg border">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-semibold">フィルター</span>
                </div>
                {isFilterOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {isFilterOpen && (
                <div className="p-3 md:p-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">ジャンル</label>
                      <Select value={genreFilter} onValueChange={setGenreFilter}>
                        <SelectTrigger className="h-8 md:h-10">
                          <SelectValue placeholder="ジャンルを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          <SelectItem value="textbook">講義参考書</SelectItem>
                          <SelectItem value="certification">資格書</SelectItem>
                          <SelectItem value="jobhunting">就活関連書</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">商品状態</label>
                      <Select value={conditionFilter} onValueChange={setConditionFilter}>
                        <SelectTrigger className="h-8 md:h-10">
                          <SelectValue placeholder="状態を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          <SelectItem value="excellent">ほぼ新品</SelectItem>
                          <SelectItem value="good">良好</SelectItem>
                          <SelectItem value="fair">やや傷あり</SelectItem>
                          <SelectItem value="poor">傷あり</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="flex items-center space-x-2 h-8 md:h-10">
                        <Checkbox
                          id="hideSold"
                          checked={!showSold}
                          onCheckedChange={(checked) => setShowSold(!checked)}
                        />
                        <label htmlFor="hideSold" className="text-sm">
                          売り切れを表示しない
                        </label>
                      </div>
                    </div>

                    {userProfile?.university && (
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center space-x-2 h-8 md:h-10">
                          <Checkbox
                            id="sameUniversity"
                            checked={sameUniversityOnly}
                            onCheckedChange={(checked) => setSameUniversityOnly(checked === true)}
                          />
                          <label htmlFor="sameUniversity" className="text-sm">
                            {userProfile.university}のみ表示
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ソート機能（3分割） */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={sortBy === "newest" ? "default" : "outline"}
                onClick={() => setSortBy("newest")}
                className="text-xs md:text-sm h-8 md:h-10"
              >
                新着順
              </Button>
              <Button
                variant={sortBy === "price-low" ? "default" : "outline"}
                onClick={() => setSortBy("price-low")}
                className="text-xs md:text-sm h-8 md:h-10"
              >
                安い順
              </Button>
              <Button
                variant={sortBy === "price-high" ? "default" : "outline"}
                onClick={() => setSortBy("price-high")}
                className="text-xs md:text-sm h-8 md:h-10"
              >
                高い順
              </Button>
            </div>

            <div className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground">
              {filteredTextbooks.length} 件の教科書が見つかりました
            </div>
            
            {filteredTextbooks.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  {searchQuery || genreFilter !== "all" || conditionFilter !== "all" || sameUniversityOnly || !showSold
                    ? "検索条件に一致する教科書が見つかりませんでした"
                    : "まだ教科書が投稿されていません"}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")} size="sm">
                    検索をクリア
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {filteredTextbooks.map((textbook) => (
                  <TextbookCard key={textbook.id} textbook={textbook} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}