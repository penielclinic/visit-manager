'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MemberDialog } from './member-dialog'
import { deleteMemberAction } from '@/app/(dashboard)/households/actions'
import type { HouseholdMember } from '@/types/households'
import type { Enums } from '@/types/database.types'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'

interface MemberListProps {
  householdId: string
  members: HouseholdMember[]
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

const FAITH_STATUS_LABELS: Record<Enums<'faith_status'>, string> = {
  registered: '등록',
  unbaptized: '미세례',
  baptized: '세례',
  confirmed: '입교',
  long_absent: '장기결석',
  withdrawn: '탈퇴',
}

const FAITH_STATUS_VARIANTS: Record<
  Enums<'faith_status'>,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  registered: 'secondary',
  unbaptized: 'outline',
  baptized: 'default',
  confirmed: 'default',
  long_absent: 'destructive',
  withdrawn: 'destructive',
}

export function MemberList({ householdId, members }: MemberListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<HouseholdMember | undefined>()
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditingMember(undefined)
    setDialogOpen(true)
  }

  function openEdit(member: HouseholdMember) {
    setEditingMember(member)
    setDialogOpen(true)
  }

  function handleDelete(memberId: string) {
    if (!confirm('구성원을 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteMemberAction(memberId, householdId)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">구성원</h3>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          추가
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center" style={{ wordBreak: 'keep-all' }}>
          등록된 구성원이 없습니다.
        </p>
      ) : (
        <div className="space-y-0">
          {members.map((m, idx) => (
            <div key={m.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {m.is_primary && (
                    <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm whitespace-nowrap">
                    {m.full_name}
                  </span>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {RELATION_LABELS[m.relation]}
                  </Badge>
                  <Badge
                    variant={FAITH_STATUS_VARIANTS[m.faith_status]}
                    className="text-xs whitespace-nowrap"
                  >
                    {FAITH_STATUS_LABELS[m.faith_status]}
                  </Badge>
                  {m.birth_year && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {m.birth_year}년생
                    </span>
                  )}
                  {m.phone && (
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {m.phone}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 text-red-400 hover:text-red-600"
                    onClick={() => handleDelete(m.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MemberDialog
        householdId={householdId}
        member={editingMember}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
