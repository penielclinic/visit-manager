import { KakaoMapProvider } from '@/components/route/kakao-map-provider'
import { RoutePageClient } from './route-page-client'
import { getSchedulesForDate } from './actions'
import { todayKST } from '@/lib/date'

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function RoutePage({ searchParams }: PageProps) {
  const today = todayKST()
  const { date: dateParam } = await searchParams
  const date = dateParam ?? today

  const schedules = await getSchedulesForDate(date)

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">동선 최적화</h1>
        <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
          날짜를 선택하고 최적 심방 경로를 계산하세요
        </p>
      </div>

      <KakaoMapProvider>
        <RoutePageClient
          initialSchedules={schedules}
          initialDate={date}
        />
      </KakaoMapProvider>
    </div>
  )
}
