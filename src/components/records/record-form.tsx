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
import { Loader2, Save } from 'lucide-react'
import {
  createRecordAction,
  updateRecordAction,
  type RecordFormValues,
} from '@/app/(dashboard)/records/actions'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { VisitRecord } from '@/types/records'
import type { Enums } from '@/types/database.types'

interface HouseholdOption {
  id: string
  household_name: string
  representative_name: string
}

interface RecordFormProps {
  record?: VisitRecord
  households: HouseholdOption[]
  defaultHouseholdId?: string
  defaultScheduleId?: string
}

export function RecordForm({
  record,
  households,
  defaultHouseholdId,
  defaultScheduleId,
}: RecordFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const isEdit = !!record

  const [householdId, setHouseholdId] = useState(
    record?.household_id ?? defaultHouseholdId ?? ''
  )
  const [visitType, setVisitType] = useState<Enums<'visit_type'>>(
    record?.visit_type ?? 'regular'
  )
  const [visitedAt, setVisitedAt] = useState(
    record?.visited_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  )
  const [content, setContent] = useState(record?.content ?? '')
  const [specialNotes, setSpecialNotes] = useState(record?.special_notes ?? '')
  const [duration, setDuration] = useState(
    record?.duration_actual_min?.toString() ?? ''
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) {
      setError('가구를 선택해주세요')
      return
    }
    setError('')

    const values: RecordFormValues = {
      household_id: householdId,
      schedule_id: record?.schedule_id ?? defaultScheduleId ?? null,
      visit_type: visitType,
      visited_at: visitedAt,
      content: content || null,
      special_notes: specialNotes || null,
      duration_actual_min: duration ? parseInt(duration) : null,
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateRecordAction(record.id, values)
        : await createRecordAction(values)

      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/records/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 가구 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="household">가구 *</Label>
        <Select
          value={householdId}
          onValueChange={setHouseholdId}
          disabled={isEdit}
        >
          <SelectTrigger id="household">
            <SelectValue placeholder="가구를 선택하세요" />
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

      {/* 심방 유형 + 날짜 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="visit-type">심방 유형 *</Label>
          <Select
            value={visitType}
            onValueChange={(v) => setVisitType(v as Enums<'visit_type'>)}
          >
            <SelectTrigger id="visit-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VISIT_TYPE_LABELS).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visited-at">심방일 *</Label>
          <Input
            id="visited-at"
            type="date"
            value={visitedAt}
            onChange={(e) => setVisitedAt(e.target.value)}
            required
          />
        </div>
      </div>

      {/* 소요 시간 */}
      <div className="space-y-1.5">
        <Label htmlFor="duration">소요 시간 (분)</Label>
        <Input
          id="duration"
          type="number"
          min={1}
          max={300}
          placeholder="예: 60"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-36"
        />
      </div>

      {/* 내용 */}
      <div className="space-y-1.5">
        <Label htmlFor="content">심방 내용</Label>
        <Textarea
          id="content"
          placeholder="심방 내용을 입력하세요"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ wordBreak: 'keep-all' }}
        />
      </div>

      {/* 특이사항 */}
      <div className="space-y-1.5">
        <Label htmlFor="special-notes">특이사항</Label>
        <Textarea
          id="special-notes"
          placeholder="기도제목, 건강, 가정사 등 특이사항"
          rows={3}
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          style={{ wordBreak: 'keep-all' }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEdit ? '수정 저장' : '기록 저장'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
