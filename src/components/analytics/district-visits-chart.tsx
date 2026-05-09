'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DistrictVisitData } from '@/types/analytics'

interface Props {
  data: DistrictVisitData[]
}

export function DistrictVisitsChart({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base whitespace-nowrap">
          선교회별 심방 현황
        </CardTitle>
        <p className="text-xs text-slate-400">이번 달 기준 완료 / 전체 가구</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-slate-300 text-sm">
            선교회 데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {data.map((d) => {
              const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
              const color =
                pct >= 80
                  ? 'bg-green-500'
                  : pct >= 50
                  ? 'bg-blue-500'
                  : pct >= 20
                  ? 'bg-amber-400'
                  : 'bg-slate-300'

              return (
                <div key={d.districtName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 truncate max-w-[60%]">
                      {d.districtName}
                    </span>
                    <span className="text-slate-500 text-xs whitespace-nowrap ml-2">
                      {d.completed} / {d.total}가구
                      <span className="ml-1.5 font-semibold text-slate-700">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
