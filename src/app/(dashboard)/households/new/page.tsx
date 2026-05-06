import Link from 'next/link'
import { HouseholdForm } from '@/components/households/household-form'
import { createClient } from '@/lib/supabase/server'
import type { DistrictWithCells } from '@/types/households'
import { ChevronRight } from 'lucide-react'

async function getDistricts() {
  const supabase = createClient()
  const { data } = await supabase
    .from('districts')
    .select('*, cells(*)')
    .eq('is_active', true)
    .order('sort_order')
  return (data ?? []) as DistrictWithCells[]
}

export default async function NewHouseholdPage() {
  const districts = await getDistricts()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/households" className="hover:text-slate-700 whitespace-nowrap">
          가구 관리
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">가구 등록</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">가구 등록</h1>
        <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
          새 가구 정보를 입력하세요.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <HouseholdForm mode="create" districts={districts} />
      </div>
    </div>
  )
}
