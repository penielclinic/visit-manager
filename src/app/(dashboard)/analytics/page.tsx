import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { monthStartKST, monthsAgoStartKST } from '@/lib/date'
import { MonthlyVisitsChart } from '@/components/analytics/monthly-visits-chart'
import { DistrictVisitsChart } from '@/components/analytics/district-visits-chart'
import { VisitTypePieChart } from '@/components/analytics/visit-type-pie-chart'
import { UnvisitedHouseholdsTable } from '@/components/analytics/unvisited-households-table'
import type {
  MonthlyVisitData,
  DistrictVisitData,
  VisitTypeData,
  UnvisitedHousehold,
} from '@/types/analytics'

export const metadata: Metadata = {
  title: '통계·보고서 | 대심방 매니저',
}

async function getMonthlyVisits(): Promise<MonthlyVisitData[]> {
  const supabase = createClient()

  const from = monthsAgoStartKST(5)

  // visit_schedules.status가 아닌 visit_records.status = 'final' 기준으로 집계
  // (schedules_update RLS가 senior_pastor를 차단하여 completed 상태 업데이트 불가)
  const { data } = await supabase
    .from('visit_records')
    .select('visited_at')
    .is('deleted_at', null)
    .eq('status', 'final')
    .gte('visited_at', from)

  const map = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const key = monthsAgoStartKST(i).slice(0, 7)
    map.set(key, 0)
  }
  ;(data ?? []).forEach(({ visited_at }) => {
    const key = visited_at.slice(0, 7)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
  })

  return Array.from(map.entries()).map(([month, completed]) => ({
    month,
    label: `${parseInt(month.split('-')[1])}월`,
    completed,
  }))
}

async function getDistrictVisits(): Promise<DistrictVisitData[]> {
  const supabase = createClient()
  const from = monthStartKST()

  const [{ data: households }, { data: completed }] = await Promise.all([
    supabase
      .from('households')
      .select('id, cells(name, districts(name))')
      .is('deleted_at', null)
      .eq('status', 'active'),
    // visit_records.status = 'final' 기준으로 집계
    supabase
      .from('visit_records')
      .select('household_id')
      .is('deleted_at', null)
      .eq('status', 'final')
      .gte('visited_at', from),
  ])

  const completedSet = new Set((completed ?? []).map((r) => r.household_id))

  const districtMap = new Map<string, { completed: number; total: number }>()
  ;(households ?? []).forEach((h) => {
    const cells = h.cells as unknown as { name: string; districts: { name: string } | null } | null
    const distName = cells?.districts?.name ?? '미분류'
    const prev = districtMap.get(distName) ?? { completed: 0, total: 0 }
    districtMap.set(distName, {
      total: prev.total + 1,
      completed: prev.completed + (completedSet.has(h.id) ? 1 : 0),
    })
  })

  return Array.from(districtMap.entries())
    .map(([districtName, { completed, total }]) => ({
      districtName,
      completed,
      total,
      notVisited: total - completed,
    }))
    .sort((a, b) => b.total - a.total)
}

async function getVisitTypeDistribution(): Promise<VisitTypeData[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_records')
    .select('visit_type')
    .is('deleted_at', null)
    .eq('status', 'final')

  const countMap: Record<string, number> = {
    regular: 0,
    special: 0,
    new_member: 0,
    follow_up: 0,
  }
  ;(data ?? []).forEach(({ visit_type }) => {
    countMap[visit_type] = (countMap[visit_type] ?? 0) + 1
  })

  const total = Object.values(countMap).reduce((s, v) => s + v, 0)
  const LABELS: Record<string, string> = {
    regular: '정기심방',
    special: '특별심방',
    new_member: '새신자심방',
    follow_up: '후속심방',
  }

  return Object.entries(countMap)
    .map(([type, count]) => ({
      type,
      label: LABELS[type] ?? type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
}

async function getUnvisitedHouseholds(): Promise<UnvisitedHousehold[]> {
  const supabase = createClient()
  const from = monthStartKST()

  const [{ data: households }, { data: completed }] = await Promise.all([
    supabase
      .from('households')
      .select('id, household_name, representative_name, cells(name, districts(name))')
      .is('deleted_at', null)
      .eq('status', 'active')
      .order('household_name', { ascending: true }),
    supabase
      .from('visit_schedules')
      .select('household_id')
      .is('deleted_at', null)
      .eq('status', 'completed')
      .gte('scheduled_date', from),
  ])

  const completedSet = new Set((completed ?? []).map((r) => r.household_id))

  return (households ?? [])
    .filter((h) => !completedSet.has(h.id))
    .slice(0, 20)
    .map((h) => {
      const cells = h.cells as unknown as { name: string; districts: { name: string } | null } | null
      return {
        id: h.id,
        household_name: h.household_name,
        representative_name: h.representative_name,
        cell_name: cells?.name ?? '-',
        district_name: cells?.districts?.name ?? '-',
      }
    })
}

export default async function AnalyticsPage() {
  const [monthlyData, districtData, typeData, unvisitedData] = await Promise.all([
    getMonthlyVisits(),
    getDistrictVisits(),
    getVisitTypeDistribution(),
    getUnvisitedHouseholds(),
  ])

  const thisMonth = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">통계·보고서</h2>
        <p className="text-sm text-slate-500 mt-1" style={{ wordBreak: 'keep-all' }}>
          {thisMonth} 기준 심방 현황을 확인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyVisitsChart data={monthlyData} />
        <DistrictVisitsChart data={districtData} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VisitTypePieChart data={typeData} />
        <UnvisitedHouseholdsTable data={unvisitedData} />
      </div>
    </div>
  )
}
