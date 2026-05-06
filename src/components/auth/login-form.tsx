'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleKakaoLogin = async () => {
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('로그인 중 문제가 발생했습니다. 다시 시도해 주세요.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleKakaoLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-4 font-semibold text-[#191919] bg-[#FEE500] hover:bg-[#FDD800] active:bg-[#FCCC00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {/* 카카오 아이콘 */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2C5.58172 2 2 4.88 2 8.4C2 10.6267 3.29067 12.5907 5.32267 13.7773L4.448 17.024C4.40267 17.1787 4.57333 17.3027 4.70667 17.216L8.49733 14.7387C8.99067 14.8027 9.49333 14.836 10 14.836C14.4183 14.836 18 11.956 18 8.4C18 4.88 14.4183 2 10 2Z"
            fill="#191919"
          />
        </svg>
        <span>{isLoading ? '로그인 중...' : '카카오로 시작하기'}</span>
      </button>

      {error && (
        <p className="text-center text-xs text-destructive" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}

      <p className="text-center text-xs text-slate-400" style={{ wordBreak: 'keep-all' }}>
        교회 임원 및 구역장 이상 접근 가능합니다
      </p>
    </div>
  )
}
