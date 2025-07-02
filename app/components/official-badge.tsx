import { Crown, Shield, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OfficialBadgeProps {
  isOfficial?: boolean
  officialType?: 'admin' | 'support' | 'team'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OfficialBadge({ 
  isOfficial = false, 
  officialType = 'admin', 
  size = 'sm',
  className = ""
}: OfficialBadgeProps) {
  if (!isOfficial) return null

  const getIcon = () => {
    switch (officialType) {
      case 'admin':
        return <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      case 'support':
        return <Shield className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      case 'team':
        return <Star className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      default:
        return <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}`} />
    }
  }

  const getText = () => {
    switch (officialType) {
      case 'admin':
        return '公式'
      case 'support':
        return 'サポート'
      case 'team':
        return 'チーム'
      default:
        return '公式'
    }
  }

  const getVariant = () => {
    switch (officialType) {
      case 'admin':
        return 'default' as const // 青色
      case 'support':
        return 'secondary' as const // グレー
      case 'team':
        return 'outline' as const // アウトライン
      default:
        return 'default' as const
    }
  }

  return (
    <Badge 
      variant={getVariant()}
      className={`inline-flex items-center gap-1 ${
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 
        size === 'md' ? 'text-sm px-2 py-1' : 
        'text-base px-3 py-1.5'
      } ${className}`}
    >
      {getIcon()}
      <span>{getText()}</span>
    </Badge>
  )
}

// ユーザー名の横に表示する小さなアイコン版
export function OfficialIcon({ 
  isOfficial = false, 
  officialType = 'admin',
  className = ""
}: Pick<OfficialBadgeProps, 'isOfficial' | 'officialType' | 'className'>) {
  if (!isOfficial) return null

  const getIcon = () => {
    switch (officialType) {
      case 'admin':
        return <Crown className="h-4 w-4 text-blue-600" />
      case 'support':
        return <Shield className="h-4 w-4 text-gray-600" />
      case 'team':
        return <Star className="h-4 w-4 text-yellow-600" />
      default:
        return <Crown className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <span className={`inline-flex items-center ${className}`} title={`公式アカウント (${officialType})`}>
      {getIcon()}
    </span>
  )
}