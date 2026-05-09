'use client'

import { useState } from 'react'
import { VisitMap } from '@/components/route/visit-map'
import { RouteOptimizerPanel } from '@/components/route/route-optimizer-panel'
import type { ScheduleWithCoords, RouteNode } from '@/types/routes'

interface RoutePageClientProps {
  initialSchedules: ScheduleWithCoords[]
  initialDate: string
}

export function RoutePageClient({
  initialSchedules,
  initialDate,
}: RoutePageClientProps) {
  const [nodes, setNodes] = useState<RouteNode[]>([])

  return (
    <div className="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-8rem)]">
      {/* 패널 */}
      <div className="md:w-80 md:flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:overflow-y-auto">
        <RouteOptimizerPanel
          initialSchedules={initialSchedules}
          initialDate={initialDate}
          onNodesChange={setNodes}
        />
      </div>

      {/* 지도 — 모바일: 고정 높이, 데스크탑: 나머지 전체 */}
      <div className="h-[60vw] min-h-[280px] md:h-auto md:flex-1 md:min-w-0">
        <VisitMap nodes={nodes} height="100%" />
      </div>
    </div>
  )
}
