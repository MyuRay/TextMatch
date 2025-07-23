"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Download, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

  useEffect(() => {
    // iOS検出
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // スタンドアローンモード検出
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsInStandaloneMode(standalone)

    // beforeinstallprompt イベントをキャッチ
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // ローカルストレージで表示回数を確認
      const dismissCount = parseInt(localStorage.getItem('a2hs-dismiss-count') || '0')
      const lastShown = localStorage.getItem('a2hs-last-shown')
      const now = new Date().getTime()
      const oneWeek = 7 * 24 * 60 * 60 * 1000

      // 3回以上却下されていない、かつ最後に表示してから1週間経過している場合
      if (dismissCount < 3 && (!lastShown || now - parseInt(lastShown) > oneWeek)) {
        setTimeout(() => setShowInstallPrompt(true), 3000) // 3秒後に表示
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS用: 初回アクセス時にプロンプト表示
    if (iOS && !standalone) {
      const dismissCount = parseInt(localStorage.getItem('a2hs-ios-dismiss-count') || '0')
      const lastShown = localStorage.getItem('a2hs-ios-last-shown')
      const now = new Date().getTime()
      const oneWeek = 7 * 24 * 60 * 60 * 1000

      if (dismissCount < 3 && (!lastShown || now - parseInt(lastShown) > oneWeek)) {
        setTimeout(() => setShowInstallPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response: ${outcome}`)
      setDeferredPrompt(null)
    }
    setShowInstallPrompt(false)
    localStorage.setItem('a2hs-last-shown', new Date().getTime().toString())
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    
    if (isIOS) {
      const dismissCount = parseInt(localStorage.getItem('a2hs-ios-dismiss-count') || '0')
      localStorage.setItem('a2hs-ios-dismiss-count', (dismissCount + 1).toString())
      localStorage.setItem('a2hs-ios-last-shown', new Date().getTime().toString())
    } else {
      const dismissCount = parseInt(localStorage.getItem('a2hs-dismiss-count') || '0')
      localStorage.setItem('a2hs-dismiss-count', (dismissCount + 1).toString())
      localStorage.setItem('a2hs-last-shown', new Date().getTime().toString())
    }
  }

  // スタンドアローンモードまたは表示条件を満たさない場合は表示しない
  if (isInStandaloneMode || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm mx-auto animate-in slide-in-from-bottom duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              TextMatchをホームに追加
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            TextMatchをホーム画面に追加して、いつでも簡単にアクセスできるようにしませんか？
          </p>
          
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Safari ブラウザで：
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>画面下部の共有ボタン（□↑）をタップ</li>
                <li>「ホーム画面に追加」を選択</li>
                <li>「追加」をタップして完了</li>
              </ol>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleInstallClick} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                インストール
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                後で
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}