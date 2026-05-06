'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyVisitData } from '@/types/analytics'

interface Props {
  data: MonthlyVisitData[]
}

export function MonthlyVisitsChart({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base whitespace-nowrap">
          월별 심방 완료 현황
        </CardTitle>
        <p className="text-xs text-slate-400">최근 6개월 완료 건수</p>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.completed === 0) ? (
          <div className="flex items-center justify-center h-[260px] text-slate-300 text-sm">
            완료된 심방이 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v}건`, '완료']}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="completed"
                fill="hsl(221.2, 83.2%, 53.3%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
