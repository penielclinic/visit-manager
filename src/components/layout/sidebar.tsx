'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MapPin,
  BookOpen,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'

export const navItems = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    session: 'S1',
    available: true,
  },
  {
    href: '/households',
    label: '세대 관리',
    icon: Users,
    session: 'S3',
    available: true,
  },
  {
    href: '/schedule',
    label: '심방 일정',
    icon: CalendarDays,
    session: 'S4',
    available: true,
  },
  {
    href: '/route',
    label: '동선 최적화',
    icon: MapPin,
    session: 'S5',
    available: true,
  },
  {
    href: '/records',
    label: '심방 기록',
    icon: BookOpen,
    session: 'S6',
    available: true,
  },
  {
    href: '/analytics',
    label: '통계·보고서',
    icon: BarChart3,
    session: 'S8',
    available: true,
  },
]

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const isSeniorPastor = userRole === 'senior_pastor'

  return (
    <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-slate-200 flex-col">
      {/* 로고 */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900 whitespace-nowrap">
            대심방 매니저
          </h1>
          <p className="text-xs text-slate-400 whitespace-nowrap">
            해운대순복음교회
          </p>
        </div>
      </div>

      {/* 내비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.available ? item.href : '#'}
              aria-disabled={!item.available}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : item.available
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed pointer-events-none'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
              {!item.available && (
                <span className="ml-auto text-[10px] text-slate-300 whitespace-nowrap">
                  {item.session}
                </span>
              )}
            </Link>
          )
        })}

        {/* 관리자 메뉴 — 담임목사만 표시 */}
        {isSeniorPastor && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-purple-50 text-purple-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">관리자 설정</span>
          </Link>
        )}
      </nav>

      {/* 하단 */}
      <div className="px-4 py-3 border-t border-slate-200">
        <p className="text-[10px] text-slate-300 text-center whitespace-nowrap">
          S8 · 전 세션 완료
        </p>
      </div>
    </aside>
  )
}
