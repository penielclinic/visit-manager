import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HouseholdTable } from '@/components/households/household-table'
import { HouseholdFilters } from '@/components/households/household-filters'
import { createClient } from '@/lib/supabase/server'
import type { DistrictWithCells, HouseholdWithCell } from '@/types/households'
import { Upload, Plus } from 'lucide-react'
import { Suspense } from 'react'

interface PageProps {
  searchParams: {
    q?: string
    district?: string
    cell?: string
    status?: string
  }
}

async function getDistricts() {
  const supabase = createClient()
  const { data } = await supabase
    .from('districts')
    .select('*, cells(*)')
    .eq('is_active', true)
    .order('sort_order')
  return (data ?? []) as DistrictWithCells[]
}

async function getHouseholds(searchParams: PageProps['searchParams']) {
  const supabase = createClient()
  let query = supabase
    .from('households')
    .select(
      `*, cells(*, districts(id, name))`
    )
    .is('deleted_at', null)
    .order('household_name')

  if (searchParams.q) {
    query = query.or(
      `household_name.ilike.%${searchParams.q}%,representative_name.ilike.%${searchParams.q}%`
    )
  }
  if (searchParams.cell) {
    query = query.eq('cell_id', searchParams.cell)
  } else if (searchParams.district) {
    // filter by district via cell join
    const supabase2 = createClient()
    const { data: cells } = await supabase2
      .from('cells')
      .select('id')
      .eq('district_id', searchParams.district)
    const cellIds = (cells ?? []).map((c) => c.id)
    if (cellIds.length > 0) {
      query = query.in('cell_id', cellIds)
    } else {
      return []
    }
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status as 'active' | 'inactive' | 'moved' | 'withdrawn')
  }

  const { data } = await query
  return (data ?? []) as HouseholdWithCell[]
}

export default async function HouseholdsPage({ searchParams }: PageProps) {
  const [districts, households] = await Promise.all([
    getDistricts(),
    getHouseholds(searchParams),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">가구 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
            총 {households.length}개 가구
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/households/upload">
              <Upload className="w-4 h-4 mr-1.5" />
              엑셀 업로드
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/households/new">
              <Plus className="w-4 h-4 mr-1.5" />
              가구 등록
            </Link>
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <Suspense>
        <HouseholdFilters districts={districts} />
      </Suspense>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200">
        <HouseholdTable households={households} />
      </div>
    </div>
  )
}
