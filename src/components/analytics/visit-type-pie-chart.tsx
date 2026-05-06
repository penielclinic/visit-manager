'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VisitTypeData } from '@/types/analytics'

interface Props {
  data: VisitTypeData[]
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6']

export function VisitTypePieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base whitespace-nowrap">
          심방 유형 분포
        </CardTitle>
        <p className="text-xs text-slate-400">
          전체 완료 심방 {total}건
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-slate-300 text-sm">
            완료된 심방이 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="45%"
                outerRadius={90}
                innerRadius={52}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${v}건`,
                  name,
                ]}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value, entry) => {
                  const d = data.find((x) => x.label === value)
                  return `${value} ${d?.percentage ?? 0}%`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
