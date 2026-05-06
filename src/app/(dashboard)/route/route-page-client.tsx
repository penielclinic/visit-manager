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
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* 왼쪽 패널 */}
      <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
        <RouteOptimizerPanel
          initialSchedules={initialSchedules}
          initialDate={initialDate}
          onNodesChange={setNodes}
        />
      </div>

      {/* 지도 */}
      <div className="flex-1 min-w-0">
        <VisitMap nodes={nodes} height="100%" />
      </div>
    </div>
  )
}
