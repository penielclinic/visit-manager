import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScheduleStatusBadge } from './schedule-status-badge'
import { VISIT_TYPE_LABELS } from '@/types/schedules'
import type { ScheduleWithRelations } from '@/types/schedules'
import { CalendarClock } from 'lucide-react'

interface ScheduleTableProps {
  schedules: ScheduleWithRelations[]
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateStr))
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

export function ScheduleTable({ schedules }: ScheduleTableProps) {
  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-300">
        <CalendarClock className="w-10 h-10 mb-2" />
        <p className="text-sm" style={{ wordBreak: 'keep-all' }}>
          등록된 심방 일정이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>날짜</TableHead>
          <TableHead>가정명</TableHead>
          <TableHead>선교회 / 순</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>담당자</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((s) => (
          <TableRow key={s.id} className="cursor-pointer hover:bg-slate-50">
            <TableCell>
              <Link href={`/schedule/${s.id}`} className="block">
                <div className="whitespace-nowrap font-medium text-slate-900">
                  {formatDate(s.scheduled_date)}
                </div>
                {s.scheduled_time && (
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {formatTime(s.scheduled_time)}
                  </div>
                )}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/schedule/${s.id}`} className="block">
                <span className="whitespace-nowrap font-medium text-slate-900 hover:text-primary">
                  {s.households.household_name}
                </span>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {s.households.representative_name}
                </div>
              </Link>
            </TableCell>
            <TableCell>
              {s.households.cells ? (
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="whitespace-nowrap text-slate-500">
                    {s.households.cells.districts.name}
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="whitespace-nowrap">
                    {s.households.cells.name}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </TableCell>
            <TableCell>
              <span className="whitespace-nowrap text-sm">
                {VISIT_TYPE_LABELS[s.visit_type]}
              </span>
            </TableCell>
            <TableCell>
              <span className="whitespace-nowrap text-sm text-slate-600">
                {s.profiles?.full_name ?? '-'}
              </span>
            </TableCell>
            <TableCell>
              <ScheduleStatusBadge status={s.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
