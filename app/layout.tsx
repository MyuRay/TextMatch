import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/useAuth" // ←パスが通っているかも確認
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TextMatch",
  description: "学生のためのフリーマーケット - 教科書の売買ができるプラットフォーム",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
