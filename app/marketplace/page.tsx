"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ArrowUpDown, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextbookCard } from "./textbook-card"
import { getAllTextbooks, Textbook } from "@/lib/firestore"
import { useAuth } from "@/lib/useAuth"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

export default function MarketplacePage() {
  const { user, userProfile } = useAuth()
  const searchParams = useSearchParams()
  const urlUniversity = searchParams.get("university") ?? ""
  const urlQuery = searchParams.get("query") ?? ""

  const [searchQuery, setSearchQuery] = useState(urlQuery || urlUniversity)
  const [sortBy, setSortBy] = useState("newest")
  const [showSold, setShowSold] = useState(true)
  const [sameUniversityOnly, setSameUniversityOnly] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState("")
  const [userUniversity, setUserUniversity] = useState("")
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
    if (userProfile?.university) {
      setUserUniversity(userProfile.university)
    }
  }, [userProfile])

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

    // 同大学フィルタリング
    if (sameUniversityOnly && userUniversity) {
      filtered = filtered.filter(book => book.university === userUniversity)
    }

    // ジャンルフィルタリング
    if (selectedGenre) {
      filtered = filtered.filter(book => book.genre === selectedGenre)
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
  }, [searchQuery, sortBy, showSold, sameUniversityOnly, selectedGenre, userUniversity, allTextbooks])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">出品一覧</h1>
        
        {/* テスト運用中のお知らせ */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-800 font-medium">
            🧪 <strong>テスト運用中</strong> -  現在テスト運用中です！0円で教科書の取引をお願いします。
          </p>
        </div>

        {/* 検索バー */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="タイトル・著者・大学名で検索..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* フィルタとソート */}
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <Tabs defaultValue="newest" onValueChange={setSortBy}>
            <TabsList className="grid grid-cols-3 w-full h-9">
              <TabsTrigger value="newest" className="text-xs md:text-sm">新着順</TabsTrigger>
              <TabsTrigger value="price-low" className="text-xs md:text-sm">安い順<ArrowUpDown className="ml-1 h-3 w-3" /></TabsTrigger>
              <TabsTrigger value="price-high" className="text-xs md:text-sm">高い順</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="same-university"
                checked={sameUniversityOnly}
                onCheckedChange={(checked) => setSameUniversityOnly(checked === true)}
                disabled={!userUniversity}
              />
              <label 
                htmlFor="same-university" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                同大学のみ表示
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">ジャンル:</span>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="講義参考書">講義参考書</SelectItem>
                  <SelectItem value="資格書">資格書</SelectItem>
                  <SelectItem value="就活関連書">就活関連書</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          {filteredTextbooks.length}件の教科書
          {searchQuery && ` - "${searchQuery}" の検索結果`}
        </div>

        {filteredTextbooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
