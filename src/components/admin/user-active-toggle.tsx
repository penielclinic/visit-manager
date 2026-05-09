'use client'

import { useTransition } from 'react'
import { toggleUserActiveAction } from '@/app/(dashboard)/admin/actions'

interface UserActiveToggleProps {
  userId: string
  isActive: boolean
  isSelf: boolean
}

export function UserActiveToggle({ userId, isActive, isSelf }: UserActiveToggleProps) {
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleUserActiveAction(userId, !isActive)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending || isSelf}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
      title={isSelf ? '본인 계정은 변경 불가' : isActive ? '비활성화' : '활성화'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          isActive ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
