'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DistrictVisitData } from '@/types/analytics'

interface Props {
  data: DistrictVisitData[]
}

export function DistrictVisitsChart({ data }: Props) {
  const chartHeight = Math.max(220, data.length * 44)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base whitespace-nowrap">
          구역별 심방 현황
        </CardTitle>
        <p className="text-xs text-slate-400">이번 달 완료 / 전체 가구 수</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-slate-300 text-sm">
            구역 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="districtName"
                width={64}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${v}가구`,
                  name === 'completed' ? '완료' : '미완료',
                ]}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              />
              <Legend
                formatter={(v) => (v === 'completed' ? '완료' : '미완료')}
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="completed"
                stackId="a"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="notVisited"
                stackId="a"
                fill="#e2e8f0"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
