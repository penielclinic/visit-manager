'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMemberAction, updateMemberAction } from '@/app/(dashboard)/households/actions'
import type { MemberFormValues, HouseholdMember } from '@/types/households'
import type { Enums } from '@/types/database.types'

interface MemberDialogProps {
  householdId: string
  member?: HouseholdMember
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function MemberDialog({
  householdId,
  member,
  open,
  onOpenChange,
}: MemberDialogProps) {
  const isEdit = !!member
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const values: MemberFormValues = {
      full_name: fd.get('full_name') as string,
      relation: fd.get('relation') as Enums<'member_relation'>,
      gender: fd.get('gender') as Enums<'gender'>,
      birth_year: fd.get('birth_year') as string,
      phone: fd.get('phone') as string,
      faith_status: fd.get('faith_status') as Enums<'faith_status'>,
      is_primary: fd.get('is_primary') === 'true',
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateMemberAction(member.id, householdId, values)
        : await createMemberAction(householdId, values)

      if (!result.success) {
        setError(result.error)
        return
      }
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '구성원 수정' : '구성원 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* 이름 */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">이름 *</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={member?.full_name}
              required
              placeholder="홍길동"
            />
          </div>

          {/* 관계 */}
          <div className="space-y-1.5">
            <Label>관계 *</Label>
            <Select name="relation" defaultValue={member?.relation ?? 'head'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RELATION_LABELS) as Enums<'member_relation'>[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RELATION_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 성별 */}
          <div className="space-y-1.5">
            <Label>성별</Label>
            <Select name="gender" defaultValue={member?.gender ?? 'undisclosed'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GENDER_LABELS) as Enums<'gender'>[]).map((g) => (
                  <SelectItem key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 출생연도 */}
          <div className="space-y-1.5">
            <Label htmlFor="birth_year">출생연도</Label>
            <Input
              id="birth_year"
              name="birth_year"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              defaultValue={member?.birth_year ?? ''}
              placeholder="예: 1980"
            />
          </div>

          {/* 전화 */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={member?.phone ?? ''}
              placeholder="010-0000-0000"
            />
          </div>

          {/* 신앙 상태 */}
          <div className="space-y-1.5">
            <Label>신앙 상태</Label>
            <Select name="faith_status" defaultValue={member?.faith_status ?? 'registered'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FAITH_STATUS_LABELS) as Enums<'faith_status'>[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FAITH_STATUS_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 대표 여부 */}
          <div className="space-y-1.5">
            <Label>대표 구성원</Label>
            <Select name="is_primary" defaultValue={member?.is_primary ? 'true' : 'false'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">예</SelectItem>
                <SelectItem value="false">아니오</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? '저장 중...' : isEdit ? '수정 저장' : '추가'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
