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
  createHouseholdAction,
  updateHouseholdAction,
  createDistrictAction,
  createCellAction,
} from '@/app/(dashboard)/households/actions'
import type { HouseholdFormValues, DistrictWithCells } from '@/types/households'
import type { Enums } from '@/types/database.types'
import { Plus } from 'lucide-react'

interface HouseholdFormProps {
  mode: 'create' | 'edit'
  householdId?: string
  defaultValues?: Partial<HouseholdFormValues>
  districts: DistrictWithCells[]
}

const STATUS_LABELS: Record<Enums<'household_status'>, string> = {
  active: '활성',
  inactive: '비활성',
  moved: '이사',
  withdrawn: '탈퇴',
}

export function HouseholdForm({
  mode,
  householdId,
  defaultValues,
  districts,
}: HouseholdFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [selectedDistrictId, setSelectedDistrictId] = useState(
    () => {
      if (!defaultValues?.cell_id) return ''
      for (const d of districts) {
        if (d.cells.some((c) => c.id === defaultValues.cell_id)) return d.id
      }
      return ''
    }
  )
  const [districtList, setDistrictList] = useState(districts)

  const availableCells =
    districtList.find((d) => d.id === selectedDistrictId)?.cells ?? []

  // 구역 인라인 추가
  const [newDistrictName, setNewDistrictName] = useState('')
  const [addingDistrict, setAddingDistrict] = useState(false)
  const [districtPending, startDistrictTransition] = useTransition()

  function handleAddDistrict() {
    if (!newDistrictName.trim()) return
    startDistrictTransition(async () => {
      const result = await createDistrictAction(newDistrictName.trim())
      if (result.success) {
        setDistrictList((prev) => [
          ...prev,
          { ...result.data, cells: [], is_active: true, sort_order: 0, created_at: '', updated_at: '', description: null, leader_id: null },
        ])
        setSelectedDistrictId(result.data.id)
        setNewDistrictName('')
        setAddingDistrict(false)
      }
    })
  }

  // 순 인라인 추가
  const [newCellName, setNewCellName] = useState('')
  const [addingCell, setAddingCell] = useState(false)
  const [cellPending, startCellTransition] = useTransition()

  function handleAddCell() {
    if (!selectedDistrictId || !newCellName.trim()) return
    startCellTransition(async () => {
      const result = await createCellAction(selectedDistrictId, newCellName.trim())
      if (result.success) {
        setDistrictList((prev) =>
          prev.map((d) =>
            d.id === selectedDistrictId
              ? {
                  ...d,
                  cells: [
                    ...d.cells,
                    {
                      ...result.data,
                      district_id: selectedDistrictId,
                      is_active: true,
                      sort_order: 0,
                      leader_id: null,
                      description: null,
                      created_at: '',
                      updated_at: '',
                    },
                  ],
                }
              : d
          )
        )
        setNewCellName('')
        setAddingCell(false)
      }
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const values: HouseholdFormValues = {
      cell_id: fd.get('cell_id') as string,
      household_name: fd.get('household_name') as string,
      representative_name: fd.get('representative_name') as string,
      address_full: fd.get('address_full') as string,
      address_detail: fd.get('address_detail') as string,
      phone_primary: fd.get('phone_primary') as string,
      phone_secondary: fd.get('phone_secondary') as string,
      status: fd.get('status') as Enums<'household_status'>,
      notes: fd.get('notes') as string,
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createHouseholdAction(values)
          : await updateHouseholdAction(householdId!, values)

      if (!result.success) {
        setError(result.error)
        return
      }
      if (mode === 'create' && result.success && result.data) {
        router.push(`/households/${result.data.id}`)
      } else {
        router.push(`/households/${householdId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* 선교회 */}
      <div className="space-y-2">
        <Label>선교회 *</Label>
        <div className="flex gap-2">
          <Select
            value={selectedDistrictId}
            onValueChange={(v) => setSelectedDistrictId(v)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="선교회 선택" />
            </SelectTrigger>
            <SelectContent>
              {districtList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!addingDistrict && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setAddingDistrict(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        {addingDistrict && (
          <div className="flex gap-2 mt-1">
            <Input
              value={newDistrictName}
              onChange={(e) => setNewDistrictName(e.target.value)}
              placeholder="새 선교회명"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDistrict())}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddDistrict}
              disabled={districtPending}
            >
              추가
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setAddingDistrict(false); setNewDistrictName('') }}
            >
              취소
            </Button>
          </div>
        )}
      </div>

      {/* 순 */}
      <div className="space-y-2">
        <Label htmlFor="cell_id">순 *</Label>
        <div className="flex gap-2">
          <Select
            name="cell_id"
            defaultValue={defaultValues?.cell_id}
            disabled={!selectedDistrictId}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={selectedDistrictId ? '순 선택' : '선교회를 먼저 선택하세요'} />
            </SelectTrigger>
            <SelectContent>
              {availableCells.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDistrictId && !addingCell && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setAddingCell(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        {addingCell && (
          <div className="flex gap-2 mt-1">
            <Input
              value={newCellName}
              onChange={(e) => setNewCellName(e.target.value)}
              placeholder="새 순 이름"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCell())}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCell}
              disabled={cellPending}
            >
              추가
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setAddingCell(false); setNewCellName('') }}
            >
              취소
            </Button>
          </div>
        )}
      </div>

      {/* 가구명 */}
      <div className="space-y-2">
        <Label htmlFor="household_name">가구명 *</Label>
        <Input
          id="household_name"
          name="household_name"
          defaultValue={defaultValues?.household_name}
          required
          placeholder="예: 홍길동 가구"
        />
      </div>

      {/* 대표자명 */}
      <div className="space-y-2">
        <Label htmlFor="representative_name">대표자명 *</Label>
        <Input
          id="representative_name"
          name="representative_name"
          defaultValue={defaultValues?.representative_name}
          required
          placeholder="예: 홍길동"
        />
      </div>

      {/* 주소 */}
      <div className="space-y-2">
        <Label htmlFor="address_full">주소</Label>
        <Input
          id="address_full"
          name="address_full"
          defaultValue={defaultValues?.address_full}
          placeholder="도로명/지번 주소"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_detail">상세주소</Label>
        <Input
          id="address_detail"
          name="address_detail"
          defaultValue={defaultValues?.address_detail}
          placeholder="동·호수 등"
        />
      </div>

      {/* 전화번호 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_primary">전화1</Label>
          <Input
            id="phone_primary"
            name="phone_primary"
            defaultValue={defaultValues?.phone_primary}
            placeholder="010-0000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_secondary">전화2</Label>
          <Input
            id="phone_secondary"
            name="phone_secondary"
            defaultValue={defaultValues?.phone_secondary}
            placeholder="010-0000-0000"
          />
        </div>
      </div>

      {/* 상태 */}
      <div className="space-y-2">
        <Label>상태 *</Label>
        <Select name="status" defaultValue={defaultValues?.status ?? 'active'}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as Enums<'household_status'>[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes}
          rows={3}
          placeholder="특이사항, 방문 시 유의사항 등"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : mode === 'create' ? '가구 등록' : '수정 저장'}
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
