import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { ParsedHousehold } from '@/components/households/church-record-upload'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let body: { households: ParsedHousehold[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 })
  }

  const { households } = body
  if (!households || households.length === 0) {
    return NextResponse.json({ error: '가구 데이터가 없습니다' }, { status: 400 })
  }

  const districtCache = new Map<string, string>()
  const cellCache = new Map<string, string>()

  async function getOrCreateDistrict(name: string): Promise<string> {
    if (districtCache.has(name)) return districtCache.get(name)!
    const { data: existing } = await admin
      .from('districts')
      .select('id')
      .eq('name', name)
      .single()
    if (existing) {
      districtCache.set(name, existing.id)
      return existing.id
    }
    const { data: created, error } = await admin
      .from('districts')
      .insert({ name })
      .select('id')
      .single()
    if (error || !created) throw new Error(`선교회 생성 실패: ${name}`)
    districtCache.set(name, created.id)
    return created.id
  }

  async function getOrCreateCell(districtId: string, cellName: string): Promise<string> {
    const key = `${districtId}::${cellName}`
    if (cellCache.has(key)) return cellCache.get(key)!
    const { data: existing } = await admin
      .from('cells')
      .select('id')
      .eq('district_id', districtId)
      .eq('name', cellName)
      .single()
    if (existing) {
      cellCache.set(key, existing.id)
      return existing.id
    }
    const { data: created, error } = await admin
      .from('cells')
      .insert({ district_id: districtId, name: cellName })
      .select('id')
      .single()
    if (error || !created) throw new Error(`순 생성 실패: ${cellName}`)
    cellCache.set(key, created.id)
    return created.id
  }

  const errors: string[] = []
  let inserted = 0

  for (const h of households) {
    try {
      const districtId = await getOrCreateDistrict(h.district_name)
      const cellId = await getOrCreateCell(districtId, h.cell_name)

      const { data: household, error: hError } = await admin
        .from('households')
        .insert({
          cell_id: cellId,
          household_name: h.household_name,
          representative_name: h.representative_name,
          address_full: h.address_full,
          phone_primary: h.phone_primary,
          phone_secondary: h.phone_secondary,
          status: 'active',
          created_by: user.id,
        })
        .select('id')
        .single()

      if (hError || !household) {
        errors.push(`${h.household_name}: ${hError?.message ?? '가구 등록 실패'}`)
        continue
      }

      if (h.members.length > 0) {
        const memberRows = h.members.map((m) => ({
          household_id: household.id,
          full_name: m.full_name,
          relation: m.relation,
          gender: m.gender,
          birth_year: m.birth_year,
          phone: m.phone,
          faith_status: m.faith_status,
          is_primary: m.is_primary,
        }))

        const { error: mError } = await admin.from('household_members').insert(memberRows)
        if (mError) {
          errors.push(`${h.household_name} 구성원 등록 오류: ${mError.message}`)
        }
      }

      inserted++
    } catch (err) {
      errors.push(`${h.household_name}: ${err instanceof Error ? err.message : '처리 오류'}`)
    }
  }

  return NextResponse.json({ inserted, errors })
}
