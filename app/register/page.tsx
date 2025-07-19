"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { AvatarUpload } from "../components/avatar-upload"
import { Eye, EyeOff } from "lucide-react"
import { registerUser, sendVerificationEmail, updateUserProfile } from "@/lib/firebaseAuth"
import { saveUserProfile } from "@/lib/firestore"
import { uploadAvatar } from "@/lib/storage"
import { isUniversityEmail, getEmailValidationError } from "@/lib/universityDomains"

// CSVファイルから大学リストを読み込む関数
const loadUniversitiesFromCSV = async (): Promise<string[]> => {
  try {
    const response = await fetch('/universities.csv')
    const csvText = await response.text()
    const lines = csvText.split('\n')
    
    // ヘッダー行をスキップして、空行を除外
    const universities = lines
      .slice(1) // ヘッダー行をスキップ
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('日本の')) // 空行と「日本の〜一覧」を除外
    
    return universities
  } catch (error) {
    console.error('大学リストの読み込みに失敗しました:', error)
    // フォールバック: 主要大学のみ
    return [
      "東京大学", "京都大学", "大阪大学", "名古屋大学", "東北大学", "九州大学", "北海道大学",
      "早稲田大学", "慶應義塾大学", "上智大学", "明治大学", "青山学院大学", "立教大学", "中央大学", "法政大学"
    ]
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    nickname: "",
    email: "",
    university: "",
    grade: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [universities, setUniversities] = useState<string[]>([])
  const [universitiesLoaded, setUniversitiesLoaded] = useState(false)
  const [openUniversitySelect, setOpenUniversitySelect] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUniversities, setFilteredUniversities] = useState<string[]>([])

  // CSVファイルから大学リストを読み込む
  useEffect(() => {
    const loadUniversities = async () => {
      const universitiesList = await loadUniversitiesFromCSV()
      setUniversities(universitiesList)
      setFilteredUniversities(universitiesList)
      setUniversitiesLoaded(true)
    }
    
    loadUniversities()
  }, [])

  // 検索クエリに基づいて大学リストをフィルタリング
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUniversities(universities)
    } else {
      const filtered = universities.filter(university =>
        university.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUniversities(filtered)
    }
  }, [searchQuery, universities])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }))


    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectUniversity = (university: string) => {
    setFormData((prev) => ({ ...prev, university }))
    setOpenUniversitySelect(false)
    setSearchQuery("")
    if (errors.university) {
      setErrors((prev) => ({ ...prev, university: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = "本名を入力してください"
    if (!formData.nickname.trim()) newErrors.nickname = "表示名（ニックネーム）を入力してください"
    
    // メールアドレスの大学ドメインチェック
    const emailError = getEmailValidationError(formData.email)
    if (emailError) newErrors.email = emailError
    
    if (!formData.university) newErrors.university = "大学名を入力してください"
    if (!formData.password) newErrors.password = "パスワードを入力してください"
    else if (formData.password.length < 8) newErrors.password = "パスワードは8文字以上で入力してください"
    if (!formData.confirmPassword) newErrors.confirmPassword = "パスワードを再入力してください"
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "パスワードが一致しません"
    
    // 利用規約・プライバシーポリシー同意チェック
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "利用規約への同意が必要です"
    if (!formData.agreeToPrivacy) newErrors.agreeToPrivacy = "プライバシーポリシーへの同意が必要です"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      console.log("登録開始:", formData.email)
      const user = await registerUser(formData.email, formData.password)
      console.log("Firebase Auth登録成功:", user.uid)

      // ユーザープロフィール更新（Firebase Auth）- 本名をdisplayNameに保存
      await updateUserProfile(user, {
        displayName: formData.fullName,
      })

      // アバター画像をアップロード
      let avatarUrl = ""
      if (avatarFile) {
        try {
          console.log("アバター画像アップロード開始...")
          avatarUrl = await uploadAvatar(avatarFile, user.uid)
          console.log("アバター画像アップロード成功:", avatarUrl)
        } catch (avatarError) {
          console.error("アバター画像アップロードエラー:", avatarError)
          // アバターのアップロードに失敗しても登録は続行
        }
      }

      // Firestoreにプロフィール保存 - 表示名をfullNameに保存
      await saveUserProfile(user.uid, {
        fullName: formData.nickname,
        nickname: formData.nickname,
        email: formData.email,
        university: formData.university,
        grade: formData.grade,
        avatarUrl: avatarUrl,
        emailVerified: false, // 初期状態は未認証
      })
      console.log("プロフィール保存成功")

      // メール認証送信（一時的に無効化）
      // try {
      //   await sendVerificationEmail(user)
      //   console.log("認証メール送信成功")
      //   setRegistrationComplete(true)
      // } catch (emailError) {
      //   console.error("認証メール送信エラー:", emailError)
      //   // メール送信エラーでも登録は完了とする
      //   alert("アカウント登録は完了しましたが、認証メールの送信に失敗しました。ログイン後に再送信してください。")
      
      // 登録完了画面を表示
      console.log("アカウント登録完了（メール認証スキップ）")
      setRegistrationComplete(true)
      
    } catch (error: any) {
      console.error("登録エラー詳細:", error)
      console.error("エラーコード:", error.code)
      console.error("エラーメッセージ:", error.message)
      
      let errorMsg = "登録に失敗しました"
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "このメールアドレスは既に使用されています"
      } else if (error.code === "auth/weak-password") {
        errorMsg = "パスワードが弱すぎます（6文字以上必要）"
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "無効なメールアドレスです"
      } else {
        errorMsg = `登録に失敗しました: ${error.message}`
      }
      
      alert(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 登録完了後の画面（メール認証なし）
  if (registrationComplete) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto py-10 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">登録完了</CardTitle>
              <CardDescription>すぐにログインできます</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-sm text-muted-foreground">
                <strong>{formData.email}</strong> でアカウントが作成されました。
              </p>
              <p className="text-sm text-muted-foreground">
                すぐにログインしてTextMatchをお楽しみください。
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-green-800">
                  ✅ メール認証は現在無効化されています
                </p>
              </div>

            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                onClick={() => router.push("/stripe-setup?return_to=/login")} 
                className="w-full"
              >
                次へ：収益化設定
              </Button>
              <Button 
                onClick={() => router.push("/login")} 
                variant="outline"
                className="w-full"
              >
                スキップしてログインページへ
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                収益化設定は後からマイページでも行えます
              </p>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">アカウント登録</CardTitle>
            <CardDescription className="text-center">TextMatchに登録して教科書の売買を始めましょう</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">本名 *</Label>
                <Input id="fullName" name="fullName" placeholder="田中 太郎" value={formData.fullName} onChange={handleChange} />
                <p className="text-xs text-muted-foreground">
                   本名は他のユーザーには公開されません（身元確認・緊急時連絡用）
                </p>
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">表示名（ニックネーム）*</Label>
                <Input 
                  id="nickname" 
                  name="nickname" 
                  placeholder="たなか、太郎、Taro など" 
                  value={formData.nickname} 
                  onChange={handleChange} 
                />
                <p className="text-xs text-muted-foreground">
                   他のユーザーに表示される名前です
                </p>
                {errors.nickname && <p className="text-sm text-destructive">{errors.nickname}</p>}
              </div>

              <div className="space-y-2">
                <Label>プロフィール画像（任意）</Label>
                <AvatarUpload 
                  avatarFile={avatarFile}
                  setAvatarFile={setAvatarFile}
                  userName={formData.nickname || formData.fullName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="example@gmail.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                <p className="text-xs text-muted-foreground">
                  メール認証に使用されます
                </p>
              </div>


              <div className="space-y-2">
                <Label htmlFor="university">大学名 *</Label>
                <Popover open={openUniversitySelect} onOpenChange={setOpenUniversitySelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openUniversitySelect}
                      className="w-full justify-between"
                      disabled={!universitiesLoaded}
                    >
                      {formData.university || "大学を選択してください"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="大学名を検索..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {universitiesLoaded ? "該当する大学が見つかりません" : "大学リストを読み込み中..."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredUniversities.map((university) => (
                            <CommandItem
                              key={university}
                              value={university}
                              onSelect={() => handleSelectUniversity(university)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.university === university ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {university}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.university && <p className="text-sm text-destructive">{errors.university}</p>}
              </div>


              <div className="space-y-2">
                <Label htmlFor="grade">学年（任意）</Label>
                <Select value={formData.grade} onValueChange={(value) => handleSelectChange('grade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="学年を選択（任意）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="学部1年">学部1年</SelectItem>
                    <SelectItem value="学部2年">学部2年</SelectItem>
                    <SelectItem value="学部3年">学部3年</SelectItem>
                    <SelectItem value="学部4年">学部4年</SelectItem>
                    <SelectItem value="学部5年">学部5年</SelectItem>
                    <SelectItem value="学部6年">学部6年</SelectItem>
                    <SelectItem value="修士1年">修士1年</SelectItem>
                    <SelectItem value="修士2年">修士2年</SelectItem>
                    <SelectItem value="博士1年">博士1年</SelectItem>
                    <SelectItem value="博士2年">博士2年</SelectItem>
                    <SelectItem value="博士3年">博士3年</SelectItem>
                    <SelectItem value="研究生">研究生</SelectItem>
                    <SelectItem value="科目等履修生">科目等履修生</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="8文字以上" value={formData.password} onChange={handleChange} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="パスワードを再入力" value={formData.confirmPassword} onChange={handleChange} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              {/* 利用規約・プライバシーポリシー同意 */}
              <div className="space-y-4 pt-4">
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                          if (errors.agreeToTerms) {
                            setErrors(prev => ({ ...prev, agreeToTerms: "" }))
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="agreeToTerms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <Link href="/terms" target="_blank" className="text-primary hover:underline">
                            利用規約
                          </Link>
                          に同意する *
                        </label>
                        {errors.agreeToTerms && <p className="text-xs text-destructive">{errors.agreeToTerms}</p>}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="agreeToPrivacy"
                        name="agreeToPrivacy"
                        checked={formData.agreeToPrivacy}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({ ...prev, agreeToPrivacy: checked as boolean }))
                          if (errors.agreeToPrivacy) {
                            setErrors(prev => ({ ...prev, agreeToPrivacy: "" }))
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="agreeToPrivacy"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                            プライバシーポリシー
                          </Link>
                          に同意する *
                        </label>
                        {errors.agreeToPrivacy && <p className="text-xs text-destructive">{errors.agreeToPrivacy}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "登録中..." : "登録する"}
              </Button>
              <div className="text-center text-sm">
                すでにアカウントをお持ちですか？{" "}
                <Link href="/login" className="text-primary hover:underline">
                  ログイン
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
