import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { ExcelRow } from '@/types/households'

export async function POST(req: NextRequest) {
  // 인증 확인
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

  let body: { rows: ExcelRow[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 })
  }

  const { rows } = body
  const validRows = rows.filter((r) => !r.error)
  if (validRows.length === 0) {
    return NextResponse.json({ error: '유효한 행이 없습니다' }, { status: 400 })
  }

  // 구역 캐시: name → id
  const districtCache = new Map<string, string>()
  const cellCache = new Map<string, string>() // `${districtId}::${cellName}` → cellId

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
    if (error || !created) throw new Error(`구역 생성 실패: ${name}`)
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

  for (const row of validRows) {
    try {
      const districtId = await getOrCreateDistrict(row.선교회명)
      const cellId = await getOrCreateCell(districtId, row.순명)

      const { error } = await admin.from('households').insert({
        cell_id: cellId,
        household_name: row.가구명,
        representative_name: row.대표자명,
        address_full: row['주소(전체)'] || null,
        address_detail: row['주소(상세)'] || null,
        phone_primary: row.전화1 || null,
        phone_secondary: row.전화2 || null,
        notes: row.메모 || null,
        status: 'active',
        created_by: user.id,
      })

      if (error) {
        errors.push(`행 ${row.rowIndex}: ${error.message}`)
      } else {
        inserted++
      }
    } catch (err) {
      errors.push(`행 ${row.rowIndex}: ${err instanceof Error ? err.message : '처리 오류'}`)
    }
  }

  return NextResponse.json({ inserted, errors })
}
