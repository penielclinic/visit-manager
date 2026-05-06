import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecordTable } from '@/components/records/record-table'
import { RecordFilters } from '@/components/records/record-filters'
import type { RecordWithRelations } from '@/types/records'
import type { Enums } from '@/types/database.types'

interface PageProps {
  searchParams: {
    date_from?: string
    date_to?: string
    visit_type?: string
    status?: string
    search?: string
  }
}

async function getRecords(filters: PageProps['searchParams']): Promise<RecordWithRelations[]> {
  const supabase = createClient()

  let query = supabase
    .from('visit_records')
    .select(`
      *,
      households(
        id,
        household_name,
        representative_name,
        cells(id, name, districts(id, name))
      ),
      profiles!visit_records_visited_by_fkey(id, full_name)
    `)
    .is('deleted_at', null)
    .order('visited_at', { ascending: false })

  if (filters.date_from) query = query.gte('visited_at', filters.date_from)
  if (filters.date_to) query = query.lte('visited_at', filters.date_to + 'T23:59:59')
  if (filters.visit_type) query = query.eq('visit_type', filters.visit_type as Enums<'visit_type'>)
  if (filters.status) query = query.eq('status', filters.status as Enums<'record_status'>)
  if (filters.search) {
    query = query.or(
      `households.household_name.ilike.%${filters.search}%,households.representative_name.ilike.%${filters.search}%`
    )
  }

  const { data } = await query
  return (data ?? []) as unknown as RecordWithRelations[]
}

export default async function RecordsPage({ searchParams }: PageProps) {
  const records = await getRecords(searchParams)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">심방 기록</h1>
          <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
            심방 내용을 기록하고 관리하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/records/trash">
            <Button variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              휴지통
            </Button>
          </Link>
          <Link href="/records/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              기록 작성
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <RecordFilters />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-2 border-b border-slate-100 text-sm text-slate-500">
          총 <strong className="text-slate-800">{records.length}</strong>건
        </div>
        <RecordTable records={records} />
      </div>
    </div>
  )
}
