'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { VISIT_STATUS_LABELS, VISIT_TYPE_LABELS } from '@/types/schedules'
import type { Profile } from '@/types/schedules'
import type { Enums } from '@/types/database.types'

interface ScheduleFiltersProps {
  assignees: Pick<Profile, 'id' | 'full_name'>[]
}

export function ScheduleFilters({ assignees }: ScheduleFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const dateFrom = searchParams.get('date_from') ?? ''
  const dateTo = searchParams.get('date_to') ?? ''
  const status = searchParams.get('status') ?? ''
  const visitType = searchParams.get('visit_type') ?? ''
  const assignedTo = searchParams.get('assigned_to') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function handleReset() {
    startTransition(() => router.push(pathname))
  }

  const hasFilters = dateFrom || dateTo || status || visitType || assignedTo

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
      {/* 날짜 범위 */}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => update('date_from', e.target.value)}
          className="flex-1 sm:w-36 sm:flex-none"
          title="시작 날짜"
        />
        <span className="text-slate-400 text-sm">~</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => update('date_to', e.target.value)}
          className="flex-1 sm:w-36 sm:flex-none"
          title="종료 날짜"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
      {/* 상태 */}
      <Select
        value={status || '__all__'}
        onValueChange={(v) => update('status', v === '__all__' ? '' : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="상태 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">상태 전체</SelectItem>
          {(Object.keys(VISIT_STATUS_LABELS) as Enums<'visit_status'>[]).map((s) => (
            <SelectItem key={s} value={s}>
              {VISIT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 방문 유형 */}
      <Select
        value={visitType || '__all__'}
        onValueChange={(v) => update('visit_type', v === '__all__' ? '' : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="유형 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">유형 전체</SelectItem>
          {(Object.keys(VISIT_TYPE_LABELS) as Enums<'visit_type'>[]).map((t) => (
            <SelectItem key={t} value={t}>
              {VISIT_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 담당자 */}
      {assignees.length > 0 && (
        <Select
          value={assignedTo || '__all__'}
          onValueChange={(v) => update('assigned_to', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="담당자 전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">담당자 전체</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="whitespace-nowrap">{a.full_name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          초기화
        </Button>
      )}
      </div>
    </div>
  )
}
