import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordForm } from '@/components/records/record-form'
import type { VisitRecord } from '@/types/records'

async function getRecord(id: string): Promise<VisitRecord | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_records')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as VisitRecord | null
}

async function getHouseholds() {
  const supabase = createClient()
  const { data } = await supabase
    .from('households')
    .select('id, household_name, representative_name')
    .is('deleted_at', null)
    .order('household_name')
  return data ?? []
}

export default async function EditRecordPage({
  params,
}: {
  params: { id: string }
}) {
  const [record, households] = await Promise.all([
    getRecord(params.id),
    getHouseholds(),
  ])

  if (!record) notFound()
  if (record.status === 'final') {
    notFound() // 완료된 기록은 수정 불가
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">심방 기록 수정</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <RecordForm record={record} households={households} />
      </div>
    </div>
  )
}
