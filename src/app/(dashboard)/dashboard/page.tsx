import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CheckCircle2,
  CalendarClock,
  AlertCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { todayKST, monthStartKST, daysFromNowKST } from '@/lib/date'
import type { ScheduleWithRelations } from '@/types/schedules'
import { VISIT_TYPE_LABELS } from '@/types/schedules'
import { ScheduleStatusBadge } from '@/components/schedule/schedule-status-badge'
import { RecordStatusBadge } from '@/components/records/record-status-badge'
import type { RecordWithRelations } from '@/types/records'
import { VISIT_TYPE_LABELS as RECORD_VISIT_TYPE_LABELS } from '@/types/records'

export const metadata: Metadata = {
  title: '대시보드 | 대심방 매니저',
}

async function getDashboardStats() {
  const supabase = createClient()
  const today = todayKST()
  const monthStart = monthStartKST()

  const [
    { count: totalHouseholds },
    { data: completedRecords },
    { count: scheduledCount },
    { data: scheduledThisMonth },
  ] = await Promise.all([
    // 전체 활성 가구 수
    supabase
      .from('households')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'active'),
    // 이번 달 완료된 심방 기록 (household_id 목록)
    supabase
      .from('visit_records')
      .select('household_id')
      .is('deleted_at', null)
      .eq('status', 'final')
      .gte('visited_at', monthStart),
    // 오늘 이후 예정된 심방 건수
    supabase
      .from('visit_schedules')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_date', today),
    // 이번 달 심방 일정이 잡힌 가구 (household_id 목록)
    supabase
      .from('visit_schedules')
      .select('household_id')
      .is('deleted_at', null)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_date', monthStart),
  ])

  const completedSet = new Set((completedRecords ?? []).map((r) => r.household_id))
  const scheduledSet = new Set((scheduledThisMonth ?? []).map((r) => r.household_id))

  // 이번 달 일정이 있는 가구 중 완료된 가구
  const completedThisMonth = [...scheduledSet].filter((id) => completedSet.has(id)).length
  // 이번 달 일정이 있지만 아직 완료되지 않은 가구 (미심방)
  const notVisited = [...scheduledSet].filter((id) => !completedSet.has(id)).length

  return {
    totalHouseholds: totalHouseholds ?? 0,
    completedThisMonth,
    scheduledCount: scheduledCount ?? 0,
    notVisited,
  }
}

async function getRecentRecords(): Promise<RecordWithRelations[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_records')
    .select(`
      *,
      households(id, household_name, representative_name, cells(id, name, districts(id, name))),
      profiles!visit_records_visited_by_fkey(id, full_name)
    `)
    .is('deleted_at', null)
    .order('visited_at', { ascending: false })
    .limit(5)
  return (data ?? []) as unknown as RecordWithRelations[]
}

async function getUpcomingSchedules(): Promise<ScheduleWithRelations[]> {
  const supabase = createClient()
  const today = todayKST()
  const in7days = daysFromNowKST(7)

  const { data } = await supabase
    .from('visit_schedules')
    .select(
      `*, households(id, household_name, representative_name, cells(id, name, districts(id, name))), profiles!visit_schedules_assigned_to_fkey(id, full_name)`
    )
    .is('deleted_at', null)
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_date', today)
    .lte('scheduled_date', in7days)
    .order('scheduled_date', { ascending: true })
    .order('visit_order', { ascending: true, nullsFirst: false })
    .limit(5)

  return (data ?? []) as ScheduleWithRelations[]
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(dateStr))
}

export default async function DashboardPage() {
  const [stats, upcomingSchedules, recentRecords] = await Promise.all([
    getDashboardStats(),
    getUpcomingSchedules(),
    getRecentRecords(),
  ])

  const statCards = [
    {
      title: '전체 가구 수',
      value: stats.totalHouseholds.toString(),
      unit: '세대',
      description: '활성 가구',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: '이번 달 완료',
      value: stats.completedThisMonth.toString(),
      unit: '가구',
      description: '심방 완료',
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: '예정된 심방',
      value: stats.scheduledCount.toString(),
      unit: '건',
      description: '오늘 이후 예정',
      icon: CalendarClock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: '미심방 가구',
      value: stats.notVisited.toString(),
      unit: '가구',
      description: '일정 있지만 미방문',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="text-sm text-slate-500 mt-1" style={{ wordBreak: 'keep-all' }}>
          심방 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-500 whitespace-nowrap">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {stat.value}
                  </span>
                  <span className="text-sm text-slate-500">{stat.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 whitespace-nowrap">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 다가오는 심방 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base whitespace-nowrap">
              다가오는 심방 (7일 이내)
            </CardTitle>
            <Link
              href="/schedule"
              className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 whitespace-nowrap"
            >
              전체 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <CalendarClock className="w-10 h-10 mb-2" />
              <p className="text-sm" style={{ wordBreak: 'keep-all' }}>
                7일 이내 예정된 심방이 없습니다
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingSchedules.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/schedule/${s.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 text-left w-24">
                        <p className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(s.scheduled_date)}
                        </p>
                        {s.scheduled_time && (
                          <p className="text-xs font-medium text-slate-600 whitespace-nowrap">
                            {s.scheduled_time.slice(0, 5)}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 whitespace-nowrap">
                          {s.households.household_name}
                        </p>
                        <div className="flex flex-wrap gap-x-1 text-xs text-slate-400">
                          <span className="whitespace-nowrap">
                            {VISIT_TYPE_LABELS[s.visit_type]}
                          </span>
                          {s.profiles && (
                            <>
                              <span>·</span>
                              <span className="whitespace-nowrap">
                                {s.profiles.full_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ScheduleStatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 최근 심방 기록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base whitespace-nowrap">
              최근 심방 기록
            </CardTitle>
            <Link
              href="/records"
              className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 whitespace-nowrap"
            >
              전체 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <BookOpen className="w-10 h-10 mb-2" />
              <p className="text-sm" style={{ wordBreak: 'keep-all' }}>
                아직 심방 기록이 없습니다
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentRecords.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/records/${r.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 text-left w-24">
                        <p className="text-xs text-slate-400 whitespace-nowrap">
                          {r.visited_at.slice(0, 10)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 whitespace-nowrap">
                          {r.households.household_name}
                        </p>
                        <div className="flex flex-wrap gap-x-1 text-xs text-slate-400">
                          <span className="whitespace-nowrap">
                            {RECORD_VISIT_TYPE_LABELS[r.visit_type]}
                          </span>
                          {r.profiles && (
                            <>
                              <span>·</span>
                              <span className="whitespace-nowrap">
                                {r.profiles.full_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <RecordStatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
