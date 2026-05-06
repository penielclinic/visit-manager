import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScheduleStatusBadge } from '@/components/schedule/schedule-status-badge'
import { StatusChangeButtons } from '@/components/schedule/status-change-buttons'
import { DeleteScheduleButton } from '@/components/schedule/delete-schedule-button'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleWithRelations } from '@/types/schedules'
import { VISIT_TYPE_LABELS } from '@/types/schedules'
import { ChevronRight, Pencil, CalendarDays, Clock, User, MapPin, BookOpen } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

async function getSchedule(id: string): Promise<ScheduleWithRelations | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_schedules')
    .select(
      `*, households(id, household_name, representative_name, cells(id, name, districts(id, name))), profiles!visit_schedules_assigned_to_fkey(id, full_name)`
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as ScheduleWithRelations | null
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(dateStr))
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return null
  return timeStr.slice(0, 5)
}

export default async function ScheduleDetailPage({ params }: PageProps) {
  const schedule = await getSchedule(params.id)
  if (!schedule) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
        <Link href="/schedule" className="hover:text-slate-700 whitespace-nowrap">
          심방 일정
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">
          {schedule.households.household_name}
        </span>
      </nav>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
            {schedule.households.household_name}
          </h1>
          <ScheduleStatusBadge status={schedule.status} />
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <Button size="sm" asChild>
            <Link
              href={`/records/new?schedule_id=${schedule.id}&household_id=${schedule.household_id}`}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              기록 작성
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/schedule/${schedule.id}/edit`}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              수정
            </Link>
          </Button>
          <DeleteScheduleButton scheduleId={schedule.id} />
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">일정 정보</h2>
        <Separator />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {/* 날짜 */}
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-slate-400 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              날짜
            </dt>
            <dd className="font-medium mt-0.5 whitespace-nowrap">
              {formatDate(schedule.scheduled_date)}
            </dd>
          </div>

          {/* 시간 */}
          {formatTime(schedule.scheduled_time) && (
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                시간
              </dt>
              <dd className="font-medium mt-0.5 whitespace-nowrap">
                {formatTime(schedule.scheduled_time)}
              </dd>
            </div>
          )}

          {/* 방문 유형 */}
          <div>
            <dt className="text-slate-400">방문 유형</dt>
            <dd className="font-medium mt-0.5 whitespace-nowrap">
              {VISIT_TYPE_LABELS[schedule.visit_type]}
            </dd>
          </div>

          {/* 담당자 */}
          <div>
            <dt className="text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              담당자
            </dt>
            <dd className="font-medium mt-0.5 whitespace-nowrap">
              {schedule.profiles?.full_name ?? '미지정'}
            </dd>
          </div>

          {/* 가구 정보 */}
          <div className="col-span-2">
            <dt className="text-slate-400">가구</dt>
            <dd className="mt-0.5">
              <Link
                href={`/households/${schedule.household_id}`}
                className="font-medium hover:text-primary whitespace-nowrap"
              >
                {schedule.households.household_name}
              </Link>
              <span className="text-slate-400 ml-1.5 whitespace-nowrap">
                ({schedule.households.representative_name})
              </span>
              {schedule.households.cells && (
                <div className="flex flex-wrap gap-x-1 text-slate-500 mt-0.5">
                  <span className="whitespace-nowrap">
                    {schedule.households.cells.districts.name}
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="whitespace-nowrap">
                    {schedule.households.cells.name}
                  </span>
                </div>
              )}
            </dd>
          </div>

          {/* 방문 순서 */}
          {schedule.visit_order != null && (
            <div>
              <dt className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                방문 순서
              </dt>
              <dd className="font-medium mt-0.5">{schedule.visit_order}번째</dd>
            </div>
          )}

          {/* 메모 */}
          {schedule.memo && (
            <div className="col-span-2">
              <dt className="text-slate-400">메모</dt>
              <dd className="mt-0.5 text-slate-600" style={{ wordBreak: 'keep-all' }}>
                {schedule.memo}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 상태 변경 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <StatusChangeButtons
          scheduleId={schedule.id}
          currentStatus={schedule.status}
        />
      </div>
    </div>
  )
}
