'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { MobileNav } from './mobile-nav'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName =
    (user.user_metadata?.name as string | undefined) ?? user.email ?? '사용자'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 gap-3 flex-shrink-0">
      <MobileNav />
      <div className="flex items-center gap-2 ml-auto">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
            {displayName.charAt(0)}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
          {displayName}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        title="로그아웃"
        className="text-slate-400 hover:text-slate-700"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </header>
  )
}
