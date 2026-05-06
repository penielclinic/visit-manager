'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import type { UnvisitedHousehold } from '@/types/analytics'

interface Props {
  data: UnvisitedHousehold[]
}

export function UnvisitedHouseholdsTable({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base whitespace-nowrap">
          이번 달 미심방 가구
        </CardTitle>
        <p className="text-xs text-slate-400">
          완료된 일정이 없는 활성 가구 (상위 20개)
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-sm" style={{ wordBreak: 'keep-all' }}>
              이번 달 모든 가구 심방 완료!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
            {data.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 whitespace-nowrap">
                    {h.household_name}
                  </p>
                  <div className="flex flex-wrap gap-x-1 text-xs text-slate-400 mt-0.5">
                    <span className="whitespace-nowrap">{h.representative_name}</span>
                    <span>·</span>
                    <span className="whitespace-nowrap">
                      {h.district_name} / {h.cell_name}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/households/${h.id}`}
                  className="text-xs text-primary hover:underline whitespace-nowrap ml-3 flex-shrink-0"
                >
                  보기
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
