import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecordStatusBadge } from '@/components/records/record-status-badge'
import { DeleteRecordButton } from '@/components/records/delete-record-button'
import { FinalizeRecordButton } from '@/components/records/finalize-record-button'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { RecordWithRelations } from '@/types/records'

async function getRecord(id: string): Promise<RecordWithRelations | null> {
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
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as unknown as RecordWithRelations | null
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
      <dt className="w-28 flex-shrink-0 text-sm font-medium text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 flex-1" style={{ wordBreak: 'keep-all' }}>
        {value}
      </dd>
    </div>
  )
}

export default async function RecordDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const record = await getRecord(params.id)
  if (!record) notFound()

  const isFinal = record.status === 'final'

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
              {record.households.household_name}
            </h1>
            <RecordStatusBadge status={record.status} />
          </div>
          <p className="text-sm text-slate-500" style={{ wordBreak: 'keep-all' }}>
            심방일: {record.visited_at.slice(0, 10)}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isFinal && (
            <>
              <FinalizeRecordButton
                id={record.id}
                scheduleId={record.schedule_id}
              />
              <Link href={`/records/${record.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4 mr-2" />
                  수정
                </Button>
              </Link>
            </>
          )}
          <DeleteRecordButton id={record.id} />
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <dl>
          <Row
            label="가구"
            value={
              <Link
                href={`/households/${record.households.id}`}
                className="text-primary hover:underline"
              >
                {record.households.household_name} ({record.households.representative_name})
              </Link>
            }
          />
          <Row
            label="선교회 / 순"
            value={
              record.households.cells
                ? `${record.households.cells.districts?.name ?? ''} / ${record.households.cells.name}`
                : '-'
            }
          />
          <Row
            label="심방 유형"
            value={
              <Badge variant="outline">
                {VISIT_TYPE_LABELS[record.visit_type]}
              </Badge>
            }
          />
          <Row label="기록자" value={record.profiles?.full_name ?? '-'} />
          {record.duration_actual_min && (
            <Row label="소요 시간" value={`${record.duration_actual_min}분`} />
          )}
          <Row
            label="심방 내용"
            value={
              record.content ? (
                <p className="whitespace-pre-wrap">{record.content}</p>
              ) : (
                <span className="text-slate-400">없음</span>
              )
            }
          />
          <Row
            label="특이사항"
            value={
              record.special_notes ? (
                <p className="whitespace-pre-wrap">{record.special_notes}</p>
              ) : (
                <span className="text-slate-400">없음</span>
              )
            }
          />
        </dl>
      </div>

      <div className="flex gap-2">
        <Link href="/records">
          <Button variant="outline" size="sm">
            목록으로
          </Button>
        </Link>
      </div>
    </div>
  )
}
