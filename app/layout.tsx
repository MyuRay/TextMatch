import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/useAuth" // ←パスが通っているかも確認
import AddToHomeScreen from "@/components/add-to-home-screen"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TextMatch",
  description: "学生のためのフリーマーケット - 教科書の売買ができるプラットフォーム",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <AddToHomeScreen />
        </AuthProvider>
      </body>
    </html>
  )
}
