'use client'

import { useState, useEffect } from 'react'
import { VisitMap } from '@/components/route/visit-map'
import { RouteOptimizerPanel } from '@/components/route/route-optimizer-panel'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2 } from 'lucide-react'
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
  const [isMapFull, setIsMapFull] = useState(false)

  // 전체화면 시 body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = isMapFull ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMapFull])

  // ESC 키로 전체화면 해제
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMapFull) setIsMapFull(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isMapFull])

  return (
    <div className="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-8rem)]">
      {/* 패널 — 전체화면 시 숨김 */}
      {!isMapFull && (
        <div className="md:w-80 md:flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:overflow-y-auto">
          <RouteOptimizerPanel
            initialSchedules={initialSchedules}
            initialDate={initialDate}
            onNodesChange={setNodes}
          />
        </div>
      )}

      {/* 지도 래퍼 */}
      <div
        className={
          isMapFull
            ? 'fixed inset-0 z-50'
            : 'relative h-[60vw] min-h-[280px] md:h-auto md:flex-1 md:min-w-0'
        }
      >
        <VisitMap nodes={nodes} height="100%" />

        {/* 전체화면 토글 버튼 */}
        <Button
          size="icon"
          variant="outline"
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm shadow-md hover:bg-white h-8 w-8"
          onClick={() => setIsMapFull((v) => !v)}
          title={isMapFull ? '지도 축소 (ESC)' : '지도 전체화면'}
        >
          {isMapFull ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>

        {/* 전체화면 모드: 우상단 닫기 텍스트 힌트 */}
        {isMapFull && (
          <div className="absolute top-2 left-2 z-10 bg-black/40 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
            ESC 또는 버튼으로 닫기
          </div>
        )}
      </div>
    </div>
  )
}
