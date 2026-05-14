'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RecordStatusBadge } from './record-status-badge'
import { RecordViewDialog } from './record-view-dialog'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { VISIT_TYPE_LABELS } from '@/types/records'
import { trashRecordAction } from '@/app/(dashboard)/records/actions'
import type { RecordWithRelations } from '@/types/records'

interface RecordTableProps {
  records: RecordWithRelations[]
  isSeniorPastor?: boolean
}

function formatDate(iso: string) {
  return iso.slice(0, 10)
}

export function RecordTable({ records, isSeniorPastor = false }: RecordTableProps) {
  const [selected, setSelected] = useState<RecordWithRelations | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleTrash(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('이 심방 기록을 휴지통으로 이동하시겠습니까?')) return
    startTransition(async () => {
      await trashRecordAction(id)
      router.refresh()
    })
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        심방 기록이 없습니다.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>심방일</TableHead>
            <TableHead>가정명</TableHead>
            <TableHead>대표자</TableHead>
            <TableHead>선교회/순</TableHead>
            <TableHead>심방 유형</TableHead>
            <TableHead>기록자</TableHead>
            <TableHead>상태</TableHead>
            {isSeniorPastor && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow
              key={r.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => setSelected(r)}
            >
              <TableCell className="whitespace-nowrap">
                {formatDate(r.visited_at)}
              </TableCell>
              <TableCell>
                <span
                  className="text-primary font-medium whitespace-nowrap hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/records/${r.id}`}>
                    {r.households.household_name}
                  </Link>
                </span>
              </TableCell>
              <TableCell>
                <span className="whitespace-nowrap">
                  {r.households.representative_name}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-slate-500 text-xs whitespace-nowrap">
                  {r.households.cells
                    ? `${r.households.cells.districts?.name ?? ''} / ${r.households.cells.name}`
                    : '-'}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="whitespace-nowrap text-xs">
                  {VISIT_TYPE_LABELS[r.visit_type]}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="whitespace-nowrap text-sm">
                  {r.profiles?.full_name ?? '-'}
                </span>
              </TableCell>
              <TableCell>
                <RecordStatusBadge status={r.status} />
              </TableCell>
              {isSeniorPastor && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {r.status === 'final' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-slate-400 hover:text-red-500"
                      onClick={(e) => handleTrash(e, r.id)}
                      disabled={isPending}
                      title="휴지통으로 이동"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <RecordViewDialog
        record={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
