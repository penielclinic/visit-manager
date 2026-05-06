import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ScheduleTable } from '@/components/schedule/schedule-table'
import { ScheduleFilters } from '@/components/schedule/schedule-filters'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleWithRelations, Profile } from '@/types/schedules'
import { Plus } from 'lucide-react'

interface PageProps {
  searchParams: {
    date_from?: string
    date_to?: string
    status?: string
    visit_type?: string
    assigned_to?: string
  }
}

async function getSchedules(
  searchParams: PageProps['searchParams']
): Promise<ScheduleWithRelations[]> {
  const supabase = createClient()
  let query = supabase
    .from('visit_schedules')
    .select(
      `*, households(id, household_name, representative_name, cells(id, name, districts(id, name))), profiles!visit_schedules_assigned_to_fkey(id, full_name)`
    )
    .is('deleted_at', null)
    .order('scheduled_date', { ascending: true })
    .order('visit_order', { ascending: true, nullsFirst: false })

  if (searchParams.date_from)
    query = query.gte('scheduled_date', searchParams.date_from)
  if (searchParams.date_to)
    query = query.lte('scheduled_date', searchParams.date_to)
  if (searchParams.status)
    query = query.eq('status', searchParams.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed')
  if (searchParams.visit_type)
    query = query.eq('visit_type', searchParams.visit_type as 'regular' | 'special' | 'new_member' | 'follow_up')
  if (searchParams.assigned_to)
    query = query.eq('assigned_to', searchParams.assigned_to)

  const { data } = await query
  return (data ?? []) as ScheduleWithRelations[]
}

async function getAssignees(): Promise<Pick<Profile, 'id' | 'full_name'>[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name')
  return (data ?? []) as Pick<Profile, 'id' | 'full_name'>[]
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const [schedules, assignees] = await Promise.all([
    getSchedules(searchParams),
    getAssignees(),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">심방 일정</h1>
          <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
            총 {schedules.length}개 일정
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/schedule/new">
            <Plus className="w-4 h-4 mr-1.5" />
            일정 등록
          </Link>
        </Button>
      </div>

      {/* 필터 */}
      <Suspense>
        <ScheduleFilters assignees={assignees} />
      </Suspense>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200">
        <ScheduleTable schedules={schedules} />
      </div>
    </div>
  )
}
