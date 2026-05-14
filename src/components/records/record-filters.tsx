'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RECORD_STATUS_LABELS, VISIT_TYPE_LABELS } from '@/types/records'

export function RecordFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== '__all__') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">시작일</Label>
        <Input
          type="date"
          className="w-full sm:w-36 h-8 text-sm"
          defaultValue={searchParams.get('date_from') ?? ''}
          onChange={(e) => update('date_from', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">종료일</Label>
        <Input
          type="date"
          className="w-full sm:w-36 h-8 text-sm"
          defaultValue={searchParams.get('date_to') ?? ''}
          onChange={(e) => update('date_to', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">심방 유형</Label>
        <Select
          defaultValue={searchParams.get('visit_type') ?? '__all__'}
          onValueChange={(v) => update('visit_type', v)}
        >
          <SelectTrigger className="w-full sm:w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">전체</SelectItem>
            {Object.entries(VISIT_TYPE_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">상태</Label>
        <Select
          defaultValue={searchParams.get('status') ?? '__all__'}
          onValueChange={(v) => update('status', v)}
        >
          <SelectTrigger className="w-full sm:w-28 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">전체</SelectItem>
            {Object.entries(RECORD_STATUS_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 sm:col-span-1 space-y-1">
        <Label className="text-xs text-slate-500">검색</Label>
        <Input
          placeholder="가정명 또는 대표자명"
          className="w-full sm:w-44 h-8 text-sm"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => update('search', e.target.value)}
        />
      </div>
    </div>
  )
}
