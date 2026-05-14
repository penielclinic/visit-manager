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
import type { DistrictWithCells } from '@/types/households'
import type { Enums } from '@/types/database.types'

interface HouseholdFiltersProps {
  districts: DistrictWithCells[]
}

const STATUS_LABELS: Record<Enums<'household_status'>, string> = {
  active: '활성',
  inactive: '비활성',
  moved: '이사',
  withdrawn: '탈퇴',
}

export function HouseholdFilters({ districts }: HouseholdFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const districtId = searchParams.get('district') ?? ''
  const cellId = searchParams.get('cell') ?? ''
  const status = searchParams.get('status') ?? ''

  const selectedDistrict = districts.find((d) => d.id === districtId)

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // 구역 바뀌면 순 초기화
    if (key === 'district') params.delete('cell')
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    update('q', (fd.get('q') as string) ?? '')
  }

  function handleReset() {
    startTransition(() => router.push(pathname))
  }

  const hasFilters = q || districtId || cellId || status

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="가정명·대표자 검색"
          className="flex-1 sm:w-52 sm:flex-none"
        />
        <Button type="submit" variant="outline" size="sm">
          검색
        </Button>
      </form>

      <div className="flex flex-wrap gap-3 items-center">
      <Select
        value={districtId || '__all__'}
        onValueChange={(v) => update('district', v === '__all__' ? '' : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="선교회 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">선교회 전체</SelectItem>
          {districts.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              <span className="whitespace-nowrap">{d.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedDistrict && (
        <Select
          value={cellId || '__all__'}
          onValueChange={(v) => update('cell', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="순 전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">순 전체</SelectItem>
            {selectedDistrict.cells.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="whitespace-nowrap">{c.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={status || '__all__'}
        onValueChange={(v) => update('status', v === '__all__' ? '' : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="상태 전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">상태 전체</SelectItem>
          {(Object.keys(STATUS_LABELS) as Enums<'household_status'>[]).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          초기화
        </Button>
      )}
      </div>
    </div>
  )
}
