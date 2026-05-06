import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TrashRecordActions } from '@/components/records/trash-record-actions'
import { RecordStatusBadge } from '@/components/records/record-status-badge'
import { Badge } from '@/components/ui/badge'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { RecordWithRelations } from '@/types/records'

async function getTrashedRecords(): Promise<RecordWithRelations[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_records')
    .select(`
      *,
      households(
        id,
        household_name,
        representative_name,
        cells(id, name, districts(id, name))
      ),
      profiles!visit_records_visited_by_fkey(id, full_name)
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  return (data ?? []) as unknown as RecordWithRelations[]
}

export default async function TrashPage() {
  const records = await getTrashedRecords()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/records">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            기록 목록
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">휴지통</h1>
          <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
            삭제된 심방 기록을 복원하거나 영구 삭제하세요
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          휴지통이 비어 있습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {records.map((r) => (
            <div key={r.id} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800 whitespace-nowrap">
                    {r.households.household_name}
                  </span>
                  <span className="text-slate-400 text-xs whitespace-nowrap">
                    {r.visited_at.slice(0, 10)}
                  </span>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {VISIT_TYPE_LABELS[r.visit_type]}
                  </Badge>
                  <RecordStatusBadge status={r.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                  {r.households.representative_name} · {r.profiles?.full_name ?? '-'}
                </p>
              </div>
              <TrashRecordActions id={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
