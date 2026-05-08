import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecordStatusBadge } from '@/components/records/record-status-badge'
import { DeleteRecordButton } from '@/components/records/delete-record-button'
import { FinalizeRecordButton } from '@/components/records/finalize-record-button'
import { PrintRecordButton } from '@/components/records/print-record-button'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { RecordWithRelations } from '@/types/records'
import type { Tables } from '@/types/database.types'

type VoiceRecording = Tables<'voice_recordings'>

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

async function getVoiceRecordings(recordId: string): Promise<VoiceRecording[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('voice_recordings')
    .select('*')
    .eq('record_id', recordId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  return data ?? []
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
  const [record, voiceRecordings] = await Promise.all([
    getRecord(params.id),
    getVoiceRecordings(params.id),
  ])
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
          <PrintRecordButton id={record.id} />
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
            label="기도제목"
            value={
              record.prayer_notes ? (
                <p className="whitespace-pre-wrap">{record.prayer_notes}</p>
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

      {/* 음성 녹음 원문 */}
      {voiceRecordings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              음성 녹음 원문
            </h2>
            <span className="text-xs text-slate-400">({voiceRecordings.length}건)</span>
          </div>
          <div className="space-y-4">
            {voiceRecordings.map((rec, i) => (
              <div key={rec.id} className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">녹음 #{i + 1}</span>
                  <div className="flex items-center gap-2">
                    {rec.processed_at && (
                      <span className="text-xs text-slate-400">
                        {new Date(rec.processed_at).toLocaleString('ko-KR')}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rec.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      rec.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {rec.status === 'completed' ? 'AI 분류 완료' :
                       rec.status === 'failed' ? '분류 실패' :
                       rec.status === 'processing' ? '처리 중' : rec.status}
                    </span>
                  </div>
                </div>
                {rec.transcript ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                    {rec.transcript}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">원문 없음</p>
                )}
                {rec.error_message && (
                  <p className="mt-2 text-xs text-red-500">{rec.error_message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
