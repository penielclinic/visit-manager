import { createClient } from '@/lib/supabase/server'
import { RecordForm } from '@/components/records/record-form'

interface PageProps {
  searchParams: {
    schedule_id?: string
    household_id?: string
  }
}

async function getHouseholds() {
  const supabase = createClient()
  const { data } = await supabase
    .from('households')
    .select('id, household_name, representative_name')
    .is('deleted_at', null)
    .eq('status', 'active')
    .order('household_name')
  return data ?? []
}

export default async function NewRecordPage({ searchParams }: PageProps) {
  const households = await getHouseholds()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">심방 기록 작성</h1>
        <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
          심방 내용을 기록해주세요
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <RecordForm
          households={households}
          defaultHouseholdId={searchParams.household_id}
          defaultScheduleId={searchParams.schedule_id}
        />
      </div>
    </div>
  )
}
