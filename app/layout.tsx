import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/useAuth" // ←パスが通っているかも確認
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Campus Books",
  description: "大学生向け教科書売買アプリ",
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
