import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ScheduleForm } from '@/components/schedule/schedule-form'
import { createClient } from '@/lib/supabase/server'
import type { VisitSchedule, ScheduleFormValues, Profile } from '@/types/schedules'
import { ChevronRight } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

async function getSchedule(id: string): Promise<VisitSchedule | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_schedules')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as VisitSchedule | null
}

async function getFormData() {
  const supabase = createClient()
  const [{ data: households }, { data: assignees }] = await Promise.all([
    supabase
      .from('households')
      .select('id, household_name, representative_name')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('household_name'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name'),
  ])
  return {
    households: households ?? [],
    assignees: (assignees ?? []) as Pick<Profile, 'id' | 'full_name'>[],
  }
}

export default async function EditSchedulePage({ params }: PageProps) {
  const [schedule, { households, assignees }] = await Promise.all([
    getSchedule(params.id),
    getFormData(),
  ])
  if (!schedule) notFound()

  const defaultValues: ScheduleFormValues = {
    household_id: schedule.household_id,
    scheduled_date: schedule.scheduled_date,
    scheduled_time: schedule.scheduled_time?.slice(0, 5) ?? '',
    visit_type: schedule.visit_type,
    status: schedule.status,
    assigned_to: schedule.assigned_to ?? '',
    memo: schedule.memo ?? '',
    visit_order: schedule.visit_order?.toString() ?? '',
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
        <Link href="/schedule" className="hover:text-slate-700 whitespace-nowrap">
          심방 일정
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <Link
          href={`/schedule/${schedule.id}`}
          className="hover:text-slate-700 whitespace-nowrap"
        >
          일정 상세
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">수정</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">일정 수정</h1>
        <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
          심방 일정 정보를 수정합니다.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ScheduleForm
          mode="edit"
          scheduleId={schedule.id}
          defaultValues={defaultValues}
          households={households}
          assignees={assignees}
        />
      </div>
    </div>
  )
}
