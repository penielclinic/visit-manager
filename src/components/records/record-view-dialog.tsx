'use client'

import Link from 'next/link'
import { ExternalLink, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RecordStatusBadge } from './record-status-badge'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { RecordWithRelations } from '@/types/records'

interface RecordViewDialogProps {
  record: RecordWithRelations | null
  open: boolean
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <dt className="w-24 flex-shrink-0 text-xs font-medium text-slate-500 pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 flex-1" style={{ wordBreak: 'keep-all' }}>
        {children}
      </dd>
    </div>
  )
}

export function RecordViewDialog({ record, open, onClose }: RecordViewDialogProps) {
  if (!record) return null

  const district = record.households.cells?.districts?.name ?? ''
  const cell = record.households.cells?.name ?? ''

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="whitespace-nowrap">
              {record.households.household_name}
            </DialogTitle>
            <RecordStatusBadge status={record.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            심방일: {record.visited_at.slice(0, 10)}
          </p>
        </DialogHeader>

        {/* 스크롤 가능한 본문 */}
        <div className="overflow-y-auto flex-1 px-6 py-2">
          <dl>
            <Field label="가구">
              {record.households.household_name} ({record.households.representative_name})
            </Field>
            {(district || cell) && (
              <Field label="선교회/순">
                <span className="text-slate-600">{district && cell ? `${district} / ${cell}` : '-'}</span>
              </Field>
            )}
            <Field label="심방 유형">
              <Badge variant="outline" className="text-xs">
                {VISIT_TYPE_LABELS[record.visit_type]}
              </Badge>
            </Field>
            <Field label="기록자">{record.profiles?.full_name ?? '-'}</Field>
            {record.duration_actual_min && (
              <Field label="소요 시간">{record.duration_actual_min}분</Field>
            )}
            <Field label="심방 내용">
              {record.content
                ? <p className="whitespace-pre-wrap">{record.content}</p>
                : <span className="text-slate-400">없음</span>
              }
            </Field>
            <Field label="기도제목">
              {record.prayer_notes
                ? <p className="whitespace-pre-wrap">{record.prayer_notes}</p>
                : <span className="text-slate-400">없음</span>
              }
            </Field>
            <Field label="특이사항">
              {record.special_notes
                ? <p className="whitespace-pre-wrap">{record.special_notes}</p>
                : <span className="text-slate-400">없음</span>
              }
            </Field>
          </dl>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.open(`/records/${record.id}/print`, '_blank')}
          >
            <Printer className="w-3.5 h-3.5" />
            PDF 저장
          </Button>
          <Link href={`/records/${record.id}`} className="flex-1">
            <Button size="sm" className="w-full gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              전체 보기
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
