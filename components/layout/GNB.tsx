'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const menus = [
  { label: '기관관리', href: '/organization' },
  { label: '대상자관리', href: '/clients' },
  { label: '계획/진행/실적', href: '/plans' },
  { label: '사례관리', href: '/cases' },
  { label: '보고서', href: '/reports' },
  { label: '통계', href: '/stats' },
  { label: '급여관리', href: '/salary' },
  { label: '재무회계', href: '/finance' },
  { label: '커뮤니티', href: '/community' },
]

export function GNB() {
  const pathname = usePathname()
  return (
    <header className="h-[60px] bg-[#2d7a2d] text-white flex items-center px-4 gap-1 sticky top-0 z-40">
      <span className="font-bold text-base mr-6 whitespace-nowrap">재가복지센터</span>
      {menus.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className={cn(
            'px-3 py-1.5 rounded text-sm whitespace-nowrap hover:bg-white/20 transition-colors',
            pathname.startsWith(m.href) && 'bg-white/30 font-semibold'
          )}
        >
          {m.label}
        </Link>
      ))}
    </header>
  )
}
