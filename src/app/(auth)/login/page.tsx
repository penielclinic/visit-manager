import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '로그인 | 대심방 매니저',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                대심방 매니저
              </h1>
              <p className="text-sm text-slate-500 mt-1">해운대순복음교회</p>
            </div>
          </div>

          <LoginForm />
        </div>

        <p
          className="mt-6 text-center text-xs text-slate-400"
          style={{ wordBreak: 'keep-all' }}
        >
          © 2025 해운대순복음교회 AI위원회
        </p>
      </div>
    </div>
  )
}
