'use client'

import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRoleAction } from '@/app/(dashboard)/admin/actions'
import type { Enums } from '@/types/database.types'

const ROLE_LABELS: Record<Enums<'user_role'>, string> = {
  senior_pastor: '담임목사',
  associate_pastor: '부목사',
  officer: '임원',
  district_leader: '선교회장',
  cell_leader: '구역장',
  member: '일반 성도',
}

interface UserRoleSelectProps {
  userId: string
  currentRole: Enums<'user_role'>
  isSelf: boolean
}

export function UserRoleSelect({ userId, currentRole, isSelf }: UserRoleSelectProps) {
  const [pending, startTransition] = useTransition()

  function handleChange(role: string) {
    startTransition(async () => {
      await updateUserRoleAction(userId, role as Enums<'user_role'>)
    })
  }

  return (
    <Select
      value={currentRole}
      onValueChange={handleChange}
      disabled={pending || isSelf}
    >
      <SelectTrigger className="h-8 text-xs w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value} className="text-xs">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
