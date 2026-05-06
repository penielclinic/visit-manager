import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { HouseholdWithCell } from '@/types/households'
import type { Enums } from '@/types/database.types'

interface HouseholdTableProps {
  households: HouseholdWithCell[]
}

const STATUS_CONFIG: Record<
  Enums<'household_status'>,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: '활성', variant: 'default' },
  inactive: { label: '비활성', variant: 'secondary' },
  moved: { label: '이사', variant: 'outline' },
  withdrawn: { label: '탈퇴', variant: 'destructive' },
}

export function HouseholdTable({ households }: HouseholdTableProps) {
  if (households.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p style={{ wordBreak: 'keep-all' }}>등록된 가구가 없습니다.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>가구명</TableHead>
          <TableHead>대표자</TableHead>
          <TableHead>구역 / 순</TableHead>
          <TableHead>전화</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {households.map((h) => {
          const status = STATUS_CONFIG[h.status]
          return (
            <TableRow key={h.id} className="cursor-pointer hover:bg-slate-50">
              <TableCell>
                <Link
                  href={`/households/${h.id}`}
                  className="font-medium text-slate-900 hover:text-primary whitespace-nowrap"
                >
                  {h.household_name}
                </Link>
              </TableCell>
              <TableCell>
                <span className="whitespace-nowrap">{h.representative_name}</span>
              </TableCell>
              <TableCell>
                {h.cells ? (
                  <div className="flex flex-wrap gap-x-1">
                    <span className="whitespace-nowrap text-slate-500">
                      {h.cells.districts.name}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="whitespace-nowrap">{h.cells.name}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="whitespace-nowrap text-sm text-slate-600">
                  {h.phone_primary ?? '-'}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
