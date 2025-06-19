"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ArrowUpDown, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { TextbookCard } from "./textbook-card"
import { getAllTextbooks, Textbook } from "@/lib/firestore"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const urlUniversity = searchParams.get("university") ?? ""
  const urlQuery = searchParams.get("query") ?? ""

  const [searchQuery, setSearchQuery] = useState(urlQuery || urlUniversity)
  const [sortBy, setSortBy] = useState("newest")
  const [showSold, setShowSold] = useState(true)
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
    
    // 売切済みアイテムのフィルタリング
    if (!showSold) {
      filtered = filtered.filter(book => book.status !== 'sold')
    }

    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        break
      case "price-low":
        filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case "price-high":
        filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case "popular":
        filtered.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        break
    }

    setFilteredTextbooks(filtered)
  }, [searchQuery, sortBy, showSold, allTextbooks])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="container mx-auto py-6 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-6">出品一覧</h1>

        {/* ✅ 検索バー復活 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="タイトル・著者・大学名で検索..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Tabs defaultValue="newest" onValueChange={setSortBy}>
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="newest">新着順</TabsTrigger>
              <TabsTrigger value="price-low">価格（安い順）<ArrowUpDown className="ml-1 h-3 w-3" /></TabsTrigger>
              <TabsTrigger value="price-high">価格（高い順）</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Checkbox 
              id="show-sold"
              checked={showSold}
              onCheckedChange={(checked) => setShowSold(checked === true)}
            />
            <label 
              htmlFor="show-sold" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              売切済みを表示
            </label>
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          {filteredTextbooks.length}件の教科書
          {searchQuery && ` - "${searchQuery}" の検索結果`}
        </div>

        {filteredTextbooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTextbooks.map((book) => (
              <TextbookCard key={book.id} textbook={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">教科書が見つかりませんでした</h3>
            <p className="text-muted-foreground mt-2">検索条件を変更してお試しください</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
