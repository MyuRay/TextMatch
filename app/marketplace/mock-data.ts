export interface Textbook {
  id: string
  title: string
  author: string
  description: string
  price: number
  department: string
  condition: string
  imageUrl: string
  postedDate: string
  views: number
  meetupLocation?: string
}

export const mockTextbooks: Textbook[] = [
  {
    id: "1",
    title: "アルゴリズム入門",
    author: "トーマス・H・コルメン、チャールズ・E・レイザーソン、ロナルド・L・リベスト、クリフォード・スタイン",
    description: "コンピュータアルゴリズムの基礎から応用までを網羅した教科書です。",
    price: 4599,
    department: "コンピュータサイエンス",
    condition: "good",
    imageUrl: "/placeholder.svg?height=300&width=400&text=アルゴリズム",
    postedDate: "2025-05-10T14:30:00Z",
    views: 42,
    meetupLocation: "図書館入口",
  },
  {
    id: "2",
    title: "有機化学",
    author: "ポーラ・ユルカニス・ブルース",
    description: "有機化学の概念を理解するための包括的なガイドです。",
    price: 3950,
    department: "化学",
    condition: "like_new",
    imageUrl: "/placeholder.svg?height=300&width=400&text=化学",
    postedDate: "2025-05-12T09:15:00Z",
    views: 28,
    meetupLocation: "理学部ロビー",
  },
  {
    id: "3",
    title: "ミクロ経済学の原理",
    author: "N・グレゴリー・マンキュー",
    description: "ミクロ経済学の原理を解説した入門書です。",
    price: 2999,
    department: "経済学",
    condition: "fair",
    imageUrl: "/placeholder.svg?height=300&width=400&text=経済学",
    postedDate: "2025-05-08T16:45:00Z",
    views: 35,
    meetupLocation: "学生センター",
  },
  {
    id: "4",
    title: "微積分学: 早期超越関数",
    author: "ジェームズ・スチュワート",
    description: "微積分の概念を包括的に紹介する教科書です。",
    price: 5275,
    department: "数学",
    condition: "good",
    imageUrl: "/placeholder.svg?height=300&width=400&text=微積分",
    postedDate: "2025-05-11T11:20:00Z",
    views: 31,
    meetupLocation: "数学棟入口",
  },
  {
    id: "5",
    title: "心理学: 心と行動の科学",
    author: "マイケル・パッサー",
    description: "心理学の分野への入門書です。",
    price: 3425,
    department: "心理学",
    condition: "new",
    imageUrl: "/placeholder.svg?height=300&width=400&text=心理学",
    postedDate: "2025-05-13T10:00:00Z",
    views: 19,
    meetupLocation: "カフェテリア",
  },
  {
    id: "6",
    title: "Javaプログラミング入門",
    author: "Y・ダニエル・リャン",
    description: "Javaプログラミングの包括的な入門書です。",
    price: 4200,
    department: "コンピュータサイエンス",
    condition: "good",
    imageUrl: "/placeholder.svg?height=300&width=400&text=Java",
    postedDate: "2025-05-09T13:10:00Z",
    views: 38,
    meetupLocation: "情報科学棟",
  },
  {
    id: "7",
    title: "人体解剖学と生理学",
    author: "エレイン・N・マリーブ、カトヤ・ホーン",
    description: "人体の解剖学と生理学に関する詳細なガイドです。",
    price: 5999,
    department: "生物学",
    condition: "like_new",
    imageUrl: "/placeholder.svg?height=300&width=400&text=解剖学",
    postedDate: "2025-05-07T15:30:00Z",
    views: 45,
    meetupLocation: "生物学棟入口",
  },
  {
    id: "8",
    title: "科学者と技術者のための物理学",
    author: "レイモンド・A・サーウェイ、ジョン・W・ジュエット",
    description: "科学・工学系学生のための物理学概念の包括的な入門書です。",
    price: 4850,
    department: "物理学",
    condition: "good",
    imageUrl: "/placeholder.svg?height=300&width=400&text=物理学",
    postedDate: "2025-05-14T09:45:00Z",
    views: 22,
    meetupLocation: "物理学棟ロビー",
  },
]
