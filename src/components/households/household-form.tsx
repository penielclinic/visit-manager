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
  createMemberAction,
  createDistrictAction,
  createCellAction,
} from '@/app/(dashboard)/households/actions'
import type { HouseholdFormValues, DistrictWithCells } from '@/types/households'
import type { Enums } from '@/types/database.types'
import { Plus, Trash2, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

const RELATION_LABELS: Record<Enums<'member_relation'>, string> = {
  head: '가장',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  sibling: '형제/자매',
  son_in_law: '사위',
  daughter_in_law: '며느리',
  father_in_law: '장인',
  mother_in_law: '장모',
  other: '기타',
}

const GENDER_LABELS: Record<Enums<'gender'>, string> = {
  male: '남성',
  female: '여성',
  undisclosed: '미공개',
}

const FAITH_STATUS_LABELS: Record<Enums<'faith_status'>, string> = {
  registered: '등록',
  unbaptized: '미세례',
  baptized: '세례',
  confirmed: '입교',
  long_absent: '장기결석',
  withdrawn: '탈퇴',
}

type InlineMember = {
  uid: string
  full_name: string
  relation: Enums<'member_relation'>
  gender: Enums<'gender'>
  birth_year: string
  phone: string
  faith_status: Enums<'faith_status'>
  is_primary: boolean
}

const DEFAULT_NEW_MEMBER: Omit<InlineMember, 'uid'> = {
  full_name: '',
  relation: 'head',
  gender: 'undisclosed',
  birth_year: '',
  phone: '',
  faith_status: 'registered',
  is_primary: false,
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

  // 가족 구성원 (create 모드에서만)
  const [members, setMembers] = useState<InlineMember[]>([])
  const [addingMember, setAddingMember] = useState(false)
  const [newMember, setNewMember] = useState<Omit<InlineMember, 'uid'>>({ ...DEFAULT_NEW_MEMBER })

  function handleAddMember() {
    if (!newMember.full_name.trim()) return
    setMembers((prev) => [...prev, { ...newMember, uid: crypto.randomUUID() }])
    setNewMember({ ...DEFAULT_NEW_MEMBER })
    setAddingMember(false)
  }

  function handleRemoveMember(uid: string) {
    setMembers((prev) => prev.filter((m) => m.uid !== uid))
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
        // 구성원 등록
        for (const m of members) {
          await createMemberAction(result.data.id, {
            full_name: m.full_name,
            relation: m.relation,
            gender: m.gender,
            birth_year: m.birth_year,
            phone: m.phone,
            faith_status: m.faith_status,
            is_primary: m.is_primary,
          })
        }
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

      {/* 가정명 */}
      <div className="space-y-2">
        <Label htmlFor="household_name">가정명 *</Label>
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

      {/* 가족 구성원 (등록 모드에서만) */}
      {mode === 'create' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>가족 구성원</Label>
            {!addingMember && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddingMember(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                추가
              </Button>
            )}
          </div>

          {/* 추가된 구성원 목록 */}
          {members.length > 0 && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {members.map((m) => (
                <div key={m.uid} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {m.is_primary && <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    <span className="font-medium text-sm whitespace-nowrap">{m.full_name}</span>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {RELATION_LABELS[m.relation]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {FAITH_STATUS_LABELS[m.faith_status]}
                    </Badge>
                    {m.birth_year && (
                      <span className="text-xs text-slate-400 whitespace-nowrap">{m.birth_year}년생</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 text-red-400 hover:text-red-600 flex-shrink-0 ml-2"
                    onClick={() => handleRemoveMember(m.uid)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 구성원 추가 인라인 폼 */}
          {addingMember && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">이름 *</Label>
                  <Input
                    value={newMember.full_name}
                    onChange={(e) => setNewMember((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="홍길동"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">관계</Label>
                  <Select
                    value={newMember.relation}
                    onValueChange={(v) => setNewMember((p) => ({ ...p, relation: v as Enums<'member_relation'> }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RELATION_LABELS) as Enums<'member_relation'>[]).map((r) => (
                        <SelectItem key={r} value={r}>{RELATION_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">성별</Label>
                  <Select
                    value={newMember.gender}
                    onValueChange={(v) => setNewMember((p) => ({ ...p, gender: v as Enums<'gender'> }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(GENDER_LABELS) as Enums<'gender'>[]).map((g) => (
                        <SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">출생연도</Label>
                  <Input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={newMember.birth_year}
                    onChange={(e) => setNewMember((p) => ({ ...p, birth_year: e.target.value }))}
                    placeholder="예: 1980"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">전화번호</Label>
                  <Input
                    value={newMember.phone}
                    onChange={(e) => setNewMember((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">신앙 상태</Label>
                  <Select
                    value={newMember.faith_status}
                    onValueChange={(v) => setNewMember((p) => ({ ...p, faith_status: v as Enums<'faith_status'> }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FAITH_STATUS_LABELS) as Enums<'faith_status'>[]).map((f) => (
                        <SelectItem key={f} value={f}>{FAITH_STATUS_LABELS[f]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">대표 구성원</Label>
                  <Select
                    value={newMember.is_primary ? 'true' : 'false'}
                    onValueChange={(v) => setNewMember((p) => ({ ...p, is_primary: v === 'true' }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">예</SelectItem>
                      <SelectItem value="false">아니오</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddMember}
                  disabled={!newMember.full_name.trim()}
                >
                  추가
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setAddingMember(false); setNewMember({ ...DEFAULT_NEW_MEMBER }) }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : mode === 'create' ? '세대 등록' : '수정 저장'}
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
