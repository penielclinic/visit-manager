'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createScheduleAction,
  updateScheduleAction,
} from '@/app/(dashboard)/schedule/actions'
import {
  VISIT_TYPE_LABELS,
  VISIT_STATUS_LABELS,
} from '@/types/schedules'
import type { ScheduleFormValues, Profile } from '@/types/schedules'
import type { Enums } from '@/types/database.types'

// 10분 간격 시간 선택 컴포넌트
function TimeSelect({ defaultValue }: { defaultValue?: string }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '10', '20', '30', '40', '50']

  const [h, m] = defaultValue?.split(':') ?? ['', '']

  return (
    <div className="flex gap-2 items-center">
      <Select name="scheduled_time_h" defaultValue={h || '__none__'}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="시" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">-</SelectItem>
          {hours.map((hh) => (
            <SelectItem key={hh} value={hh}>{hh}시</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-slate-400 flex-shrink-0">:</span>
      <Select name="scheduled_time_m" defaultValue={m || '00'}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="분" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((mm) => (
            <SelectItem key={mm} value={mm}>{mm}분</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ScheduleFormProps {
  mode: 'create' | 'edit'
  scheduleId?: string
  defaultValues?: Partial<ScheduleFormValues>
  households: { id: string; household_name: string; representative_name: string }[]
  assignees: Pick<Profile, 'id' | 'full_name'>[]
}

export function ScheduleForm({
  mode,
  scheduleId,
  defaultValues,
  households,
  assignees,
}: ScheduleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const values: ScheduleFormValues = {
      household_id: fd.get('household_id') as string,
      scheduled_date: fd.get('scheduled_date') as string,
      scheduled_time: (() => {
        const th = fd.get('scheduled_time_h') as string
        const tm = fd.get('scheduled_time_m') as string
        return th && th !== '__none__' ? `${th}:${tm}:00` : ''
      })(),
      visit_type: fd.get('visit_type') as Enums<'visit_type'>,
      status: fd.get('status') as Enums<'visit_status'>,
      assigned_to: fd.get('assigned_to') as string,
      memo: fd.get('memo') as string,
      visit_order: fd.get('visit_order') as string,
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createScheduleAction(values)
          : await updateScheduleAction(scheduleId!, values)

      if (!result.success) {
        setError(result.error)
        return
      }
      if (mode === 'create' && result.success && result.data) {
        router.push(`/schedule/${result.data.id}`)
      } else {
        router.push(`/schedule/${scheduleId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 가구 선택 */}
      <div className="space-y-2">
        <Label>가구 *</Label>
        <Select name="household_id" defaultValue={defaultValues?.household_id}>
          <SelectTrigger>
            <SelectValue placeholder="가구 선택" />
          </SelectTrigger>
          <SelectContent>
            {households.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                <span className="whitespace-nowrap">
                  {h.household_name} ({h.representative_name})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 날짜 / 시간 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">날짜 *</Label>
          <Input
            id="scheduled_date"
            name="scheduled_date"
            type="date"
            defaultValue={defaultValues?.scheduled_date}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>시간 (선택)</Label>
          <TimeSelect defaultValue={defaultValues?.scheduled_time} />
        </div>
      </div>

      {/* 방문 유형 / 상태 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>방문 유형 *</Label>
          <Select name="visit_type" defaultValue={defaultValues?.visit_type ?? 'regular'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VISIT_TYPE_LABELS) as Enums<'visit_type'>[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {VISIT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>상태 *</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? 'scheduled'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VISIT_STATUS_LABELS) as Enums<'visit_status'>[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {VISIT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 담당자 */}
      <div className="space-y-2">
        <Label>담당자</Label>
        <Select name="assigned_to" defaultValue={defaultValues?.assigned_to ?? '__none__'}>
          <SelectTrigger>
            <SelectValue placeholder="담당자 없음" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">담당자 없음</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="whitespace-nowrap">{a.full_name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 방문 순서 */}
      <div className="space-y-2">
        <Label htmlFor="visit_order">방문 순서 (선택)</Label>
        <Input
          id="visit_order"
          name="visit_order"
          type="number"
          min={1}
          defaultValue={defaultValues?.visit_order}
          placeholder="같은 날 방문 순서"
          className="w-40"
        />
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="memo">메모</Label>
        <Textarea
          id="memo"
          name="memo"
          defaultValue={defaultValues?.memo}
          rows={3}
          placeholder="방문 전 참고사항, 준비물 등"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : mode === 'create' ? '일정 등록' : '수정 저장'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
