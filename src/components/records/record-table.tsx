import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RecordStatusBadge } from './record-status-badge'
import { Badge } from '@/components/ui/badge'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { RecordWithRelations } from '@/types/records'

interface RecordTableProps {
  records: RecordWithRelations[]
}

function formatDate(iso: string) {
  return iso.slice(0, 10)
}

export function RecordTable({ records }: RecordTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        심방 기록이 없습니다.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>심방일</TableHead>
          <TableHead>가구명</TableHead>
          <TableHead>대표자</TableHead>
          <TableHead>선교회/순</TableHead>
          <TableHead>심방 유형</TableHead>
          <TableHead>기록자</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="whitespace-nowrap">
              {formatDate(r.visited_at)}
            </TableCell>
            <TableCell>
              <Link
                href={`/records/${r.id}`}
                className="text-primary hover:underline whitespace-nowrap font-medium"
              >
                {r.households.household_name}
              </Link>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
