import Link from 'next/link'
import { ScheduleForm } from '@/components/schedule/schedule-form'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/schedules'
import { ChevronRight } from 'lucide-react'

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

export default async function NewSchedulePage() {
  const { households, assignees } = await getFormData()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/schedule" className="hover:text-slate-700 whitespace-nowrap">
          심방 일정
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">일정 등록</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">일정 등록</h1>
        <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
          새 심방 일정을 등록합니다.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ScheduleForm
          mode="create"
          households={households}
          assignees={assignees}
        />
      </div>
    </div>
  )
}
