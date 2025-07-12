"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { AvatarUpload } from "../components/avatar-upload"
import { Eye, EyeOff } from "lucide-react"
import { registerUser, sendVerificationEmail, updateUserProfile } from "@/lib/firebaseAuth"
import { saveUserProfile } from "@/lib/firestore"
import { uploadAvatar } from "@/lib/storage"
import { isUniversityEmail, getEmailValidationError, suggestEmailDomain } from "@/lib/universityDomains"

// 日本全国の大学リスト
const UNIVERSITIES = [
  // 国立大学（旧帝大）
  "東京大学", "京都大学", "大阪大学", "名古屋大学", "東北大学", "九州大学", "北海道大学",
  
  // 国立大学（その他）
  "東京工業大学", "一橋大学", "筑波大学", "広島大学", "神戸大学", "千葉大学", "横浜国立大学",
  "岡山大学", "金沢大学", "熊本大学", "新潟大学", "長崎大学", "鹿児島大学", "山口大学",
  "群馬大学", "茨城大学", "宇都宮大学", "埼玉大学", "信州大学", "静岡大学", "三重大学",
  "滋賀大学", "奈良女子大学", "和歌山大学", "鳥取大学", "島根大学", "徳島大学", "香川大学",
  "愛媛大学", "高知大学", "佐賀大学", "大分大学", "宮崎大学", "琉球大学", "弘前大学",
  "岩手大学", "秋田大学", "山形大学", "福島大学", "東京学芸大学", "東京農工大学", "東京海洋大学",
  "お茶の水女子大学", "電気通信大学", "外国語大学", "東京芸術大学", "東京医科歯科大学",
  "首都大学東京", "横浜市立大学", "名古屋工業大学", "京都工芸繊維大学", "大阪教育大学",
  "兵庫教育大学", "奈良教育大学", "九州工業大学", "福岡教育大学", "長崎大学", "宮崎大学",
  
  // 公立大学
  "首都大学東京", "大阪市立大学", "大阪府立大学", "横浜市立大学", "神戸市外国語大学",
  "京都府立大学", "奈良県立医科大学", "和歌山県立医科大学", "岡山県立大学", "広島市立大学",
  "北九州市立大学", "福岡県立大学", "長崎県立大学", "熊本県立大学", "宮崎県立看護大学",
  "札幌市立大学", "青森県立保健大学", "岩手県立大学", "宮城大学", "秋田県立大学",
  "山形県立保健医療大学", "福島県立医科大学", "茨城県立医療大学", "群馬県立女子大学",
  "埼玉県立大学", "千葉県立保健医療大学", "東京都立大学", "神奈川県立保健福祉大学",
  "新潟県立大学", "富山県立大学", "石川県立大学", "福井県立大学", "山梨県立大学",
  "長野県看護大学", "岐阜県立看護大学", "静岡県立大学", "愛知県立大学", "三重県立看護大学",
  "滋賀県立大学", "京都市立芸術大学", "兵庫県立大学", "島根県立大学", "岡山県立大学",
  "尾道市立大学", "山口県立大学", "香川県立保健医療大学", "愛媛県立医療技術大学",
  "高知県立大学", "福岡女子大学", "佐賀大学", "長崎県立大学", "熊本県立大学",
  "大分県立看護科学大学", "宮崎県立看護大学", "沖縄県立芸術大学", "名桜大学",
  
  // 私立大学（関東）
  "早稲田大学", "慶應義塾大学", "上智大学", "明治大学", "青山学院大学", "立教大学", "中央大学", "法政大学",
  "学習院大学", "成蹊大学", "成城大学", "明治学院大学", "國學院大學", "武蔵大学", "日本大学", "東洋大学",
  "駒澤大学", "専修大学", "亜細亜大学", "大東文化大学", "帝京大学", "国士舘大学", "拓殖大学", "東海大学",
  "神奈川大学", "関東学院大学", "文教大学", "獨協大学", "麗澤大学", "聖心女子大学", "白百合女子大学",
  "津田塾大学", "東京女子大学", "日本女子大学", "共立女子大学", "大妻女子大学", "実践女子大学",
  "昭和女子大学", "清泉女子大学", "フェリス女学院大学", "田園調布学園大学", "桜美林大学", "玉川大学",
  "創価大学", "杏林大学", "工学院大学", "芝浦工業大学", "東京電機大学", "東京理科大学", "千葉工業大学",
  "東京農業大学", "日本獣医生命科学大学", "麻布大学", "北里大学", "星薬科大学", "明治薬科大学",
  "昭和大学", "東京医科大学", "東京慈恵会医科大学", "順天堂大学", "日本医科大学", "東邦大学",
  "聖マリアンナ医科大学", "帝京大学", "東京歯科大学", "日本歯科大学", "鶴見大学", "神奈川歯科大学",
  
  // 私立大学（関西）
  "同志社大学", "立命館大学", "関西大学", "関西学院大学", "近畿大学", "龍谷大学", "京都産業大学",
  "甲南大学", "摂南大学", "神戸学院大学", "兵庫医科大学", "関西医科大学", "大阪医科大学",
  "京都府立医科大学", "滋賀医科大学", "奈良県立医科大学", "和歌山県立医科大学", "大阪歯科大学",
  "朝日大学", "松本歯科大学", "鶴見大学", "神奈川歯科大学", "日本大学松戸歯学部",
  "関西外国語大学", "京都外国語大学", "神戸女学院大学", "同志社女子大学", "京都女子大学",
  "奈良女子大学", "武庫川女子大学", "甲南女子大学", "神戸女子大学", "大阪樟蔭女子大学",
  "帝塚山学院大学", "大谷大学", "佛教大学", "花園大学", "種智院大学", "高野山大学",
  "大阪工業大学", "関西工学院大学", "摂南大学", "大阪電気通信大学", "近畿大学工学部",
  
  // 私立大学（中部）
  "南山大学", "名城大学", "中京大学", "愛知大学", "愛知学院大学", "愛知工業大学", "中部大学",
  "日本福祉大学", "金城学院大学", "椙山女学園大学", "名古屋女子大学", "愛知淑徳大学",
  "名古屋学芸大学", "藤田医科大学", "愛知医科大学", "岐阜聖徳学園大学", "朝日大学",
  "静岡理工科大学", "東海大学", "常葉大学", "静岡産業大学", "浜松学院大学", "聖隷クリストファー大学",
  "山梨学院大学", "身延山大学", "帝京科学大学", "新潟医療福祉大学", "新潟薬科大学",
  "金沢工業大学", "金沢星稜大学", "北陸大学", "仁愛大学", "福井工業大学",
  
  // 私立大学（北海道・東北）
  "北海学園大学", "札幌大学", "北星学園大学", "藤女子大学", "天使大学", "北海道医療大学",
  "札幌医科大学", "旭川医科大学", "青森大学", "八戸工業大学", "岩手医科大学", "東北学院大学",
  "東北福祉大学", "宮城学院女子大学", "秋田看護福祉大学", "東北芸術工科大学", "東日本国際大学",
  "奥羽大学", "郡山女子大学", "福島学院大学",
  
  // 私立大学（中国・四国）
  "岡山理科大学", "川崎医科大学", "就実大学", "ノートルダム清心女子大学", "中国学園大学",
  "広島工業大学", "広島国際大学", "広島文化学園大学", "安田女子大学", "比治山大学",
  "福山大学", "尾道大学", "山口東京理科大学", "梅光学院大学", "東亜大学", "宇部フロンティア大学",
  "徳島文理大学", "四国学院大学", "松山大学", "聖カタリナ大学", "高知工科大学",
  
  // 私立大学（九州・沖縄）
  "福岡大学", "西南学院大学", "久留米大学", "福岡工業大学", "九州産業大学", "中村学園大学",
  "福岡女学院大学", "筑紫女学園大学", "九州女子大学", "西日本工業大学", "日本経済大学",
  "長崎総合科学大学", "活水女子大学", "長崎外国語大学", "九州看護福祉大学", "熊本学園大学",
  "崇城大学", "九州ルーテル学院大学", "大分大学", "別府大学", "日本文理大学", "立命館アジア太平洋大学",
  "宮崎産業経営大学", "南九州大学", "鹿児島国際大学", "志學館大学", "第一工業大学",
  "沖縄国際大学", "沖縄大学", "沖縄キリスト教学院大学",
  
  // 医科大学・薬科大学
  "自治医科大学", "産業医科大学", "国際医療福祉大学", "埼玉医科大学", "独協医科大学", "獨協医科大学",
  "金沢医科大学", "愛知医科大学", "藤田医科大学", "関西医科大学", "近畿大学医学部", "兵庫医科大学",
  "川崎医科大学", "久留米大学医学部", "産業医科大学", "福岡大学医学部",
  "東京薬科大学", "昭和薬科大学", "明治薬科大学", "星薬科大学", "北里大学薬学部", "慶應義塾大学薬学部",
  "名城大学薬学部", "京都薬科大学", "大阪薬科大学", "神戸薬科大学", "武庫川女子大学薬学部",
  "広島国際大学薬学部", "松山大学薬学部", "福山大学薬学部", "徳島文理大学薬学部",
  "九州保健福祉大学薬学部", "第一薬科大学", "崇城大学薬学部", "国際医療福祉大学薬学部",
  
  // 芸術大学・音楽大学
  "東京藝術大学", "多摩美術大学", "武蔵野美術大学", "女子美術大学", "東京造形大学", "日本大学芸術学部",
  "桑沢デザイン研究所", "東京音楽大学", "国立音楽大学", "武蔵野音楽大学", "昭和音楽大学",
  "洗足学園音楽大学", "尚美学園大学", "大阪音楽大学", "相愛大学", "京都市立芸術大学",
  "沖縄県立芸術大学", "愛知県立芸術大学", "金沢美術工芸大学", "京都精華大学", "京都造形芸術大学",
  "大阪芸術大学", "宝塚大学", "神戸芸術工科大学"
]

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
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false)
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [emailDomainSuggestion, setEmailDomainSuggestion] = useState<string | null>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }))

    if (name === "university" && value.trim()) {
      const searchTerm = value.toLowerCase()
      const suggestions = UNIVERSITIES.filter((uni) =>
        uni.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        // 前方一致を優先してソート
        const aStartsWith = a.toLowerCase().startsWith(searchTerm)
        const bStartsWith = b.toLowerCase().startsWith(searchTerm)
        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        return a.localeCompare(b)
      })
      .slice(0, 10) // 最大10件表示
      
      setUniversitySuggestions(suggestions)
      setShowUniversitySuggestions(suggestions.length > 0)
      
      // 大学名に基づいてメールドメインを提案
      const domain = suggestEmailDomain(value)
      setEmailDomainSuggestion(domain)
    } else if (name === "university") {
      setShowUniversitySuggestions(false)
      setEmailDomainSuggestion(null)
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectUniversity = (university: string) => {
    setFormData((prev) => ({ ...prev, university }))
    setShowUniversitySuggestions(false)
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

      // ユーザープロフィール更新（Firebase Auth）
      await updateUserProfile(user, {
        displayName: formData.nickname,
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

      // Firestoreにプロフィール保存
      await saveUserProfile(user.uid, {
        fullName: formData.fullName,
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
                すぐにログインしてuniTexをお楽しみください。
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-green-800">
                  ✅ メール認証は現在無効化されています
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full"
              >
                ログインページへ
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                認証完了後、ログインできるようになります
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
            <CardDescription className="text-center">Campus Booksに登録して教科書の売買を始めましょう</CardDescription>
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
                {emailDomainSuggestion && (
                  <p className="text-xs text-blue-600">
                    💡 {formData.university}の推奨ドメイン: @{emailDomainSuggestion}
                  </p>
                )}
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                <p className="text-xs text-muted-foreground">
                  メール認証に使用されます
                </p>
              </div>


              <div className="space-y-2">
                <Label htmlFor="university">大学名</Label>
                <div className="relative">
                  <Input
                    id="university"
                    name="university"
                    placeholder="〇〇大学(なるべく正式名称)"
                    value={formData.university}
                    onChange={handleChange}
                    onFocus={() => universitySuggestions.length > 0 && setShowUniversitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)}
                  />
                  {showUniversitySuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                      <ul className="py-1">
                        {universitySuggestions.map((uni) => (
                          <li key={uni} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => handleSelectUniversity(uni)}>
                            {uni}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
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
