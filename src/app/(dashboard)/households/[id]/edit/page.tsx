import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HouseholdForm } from '@/components/households/household-form'
import { createClient } from '@/lib/supabase/server'
import type { DistrictWithCells, Household, HouseholdFormValues } from '@/types/households'
import { ChevronRight } from 'lucide-react'

interface PageProps {
  params: { id: string }
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

async function getHousehold(id: string): Promise<Household | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('households')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as Household | null
}

export default async function EditHouseholdPage({ params }: PageProps) {
  const [household, districts] = await Promise.all([
    getHousehold(params.id),
    getDistricts(),
  ])
  if (!household) notFound()

  const defaultValues: HouseholdFormValues = {
    cell_id: household.cell_id,
    household_name: household.household_name,
    representative_name: household.representative_name,
    address_full: household.address_full ?? '',
    address_detail: household.address_detail ?? '',
    phone_primary: household.phone_primary ?? '',
    phone_secondary: household.phone_secondary ?? '',
    status: household.status,
    notes: household.notes ?? '',
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 flex-wrap">
        <Link href="/households" className="hover:text-slate-700 whitespace-nowrap">
          세대 관리
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <Link
          href={`/households/${household.id}`}
          className="hover:text-slate-700 whitespace-nowrap"
        >
          {household.household_name}
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">수정</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">세대 수정</h1>
        <p className="text-sm text-slate-500 mt-0.5 whitespace-nowrap">
          {household.household_name}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <HouseholdForm
          mode="edit"
          householdId={household.id}
          defaultValues={defaultValues}
          districts={districts}
        />
      </div>
    </div>
  )
}
