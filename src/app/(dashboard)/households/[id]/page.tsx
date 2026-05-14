import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MemberList } from '@/components/households/member-list'
import { DeleteHouseholdButton } from '@/components/households/delete-household-button'
import { createClient } from '@/lib/supabase/server'
import type { HouseholdWithDetails } from '@/types/households'
import type { Enums } from '@/types/database.types'
import { ChevronRight, Pencil, MapPin, Phone } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

const STATUS_CONFIG: Record<
  Enums<'household_status'>,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: '활성', variant: 'default' },
  inactive: { label: '비활성', variant: 'secondary' },
  moved: { label: '이사', variant: 'outline' },
  withdrawn: { label: '탈퇴', variant: 'destructive' },
}

async function getHousehold(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('households')
    .select(`*, cells(*, districts(id, name)), household_members(*)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return data as HouseholdWithDetails | null
}

export default async function HouseholdDetailPage({ params }: PageProps) {
  const household = await getHousehold(params.id)
  if (!household) notFound()

  const status = STATUS_CONFIG[household.status]
  const members = household.household_members.filter((m) => !m.deleted_at)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/households" className="hover:text-slate-700 whitespace-nowrap">
          세대 관리
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">{household.household_name}</span>
      </nav>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
            {household.household_name}
          </h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/households/${household.id}/edit`}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              수정
            </Link>
          </Button>
          <DeleteHouseholdButton householdId={household.id} />
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">기본 정보</h2>
        <Separator />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-400">대표자</dt>
            <dd className="font-medium whitespace-nowrap">{household.representative_name}</dd>
          </div>
          {household.cells && (
            <div>
              <dt className="text-slate-400">선교회 / 순</dt>
              <dd className="font-medium">
                <div className="flex flex-wrap gap-x-1">
                  <span className="whitespace-nowrap">{household.cells.districts.name}</span>
                  <span className="text-slate-300">/</span>
                  <span className="whitespace-nowrap">{household.cells.name}</span>
                </div>
              </dd>
            </div>
          )}
          {(household.address_full || household.address_detail) && (
            <div className="col-span-2">
              <dt className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                주소
              </dt>
              <dd>
                <p style={{ wordBreak: 'keep-all' }}>{household.address_full}</p>
                {household.address_detail && (
                  <p className="text-slate-500" style={{ wordBreak: 'keep-all' }}>
                    {household.address_detail}
                  </p>
                )}
              </dd>
            </div>
          )}
          {(household.phone_primary || household.phone_secondary) && (
            <div className="col-span-2">
              <dt className="text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                전화
              </dt>
              <dd className="flex flex-wrap gap-x-3">
                {household.phone_primary && (
                  <span className="whitespace-nowrap">{household.phone_primary}</span>
                )}
                {household.phone_secondary && (
                  <span className="whitespace-nowrap text-slate-500">
                    {household.phone_secondary}
                  </span>
                )}
              </dd>
            </div>
          )}
          {household.notes && (
            <div className="col-span-2">
              <dt className="text-slate-400">메모</dt>
              <dd className="text-slate-600" style={{ wordBreak: 'keep-all' }}>
                {household.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 구성원 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <MemberList householdId={household.id} members={members} />
      </div>
    </div>
  )
}
