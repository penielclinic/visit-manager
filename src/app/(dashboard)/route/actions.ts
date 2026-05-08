'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleWithCoords, SaveRoutePayload } from '@/types/routes'
import type { ActionResult } from '@/types/households'

export async function getSchedulesForDate(
  date: string
): Promise<ScheduleWithCoords[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('visit_schedules')
    .select(
      `*, households(id, household_name, representative_name, address_full, latitude, longitude, geocoded_at, cells(id, name, districts(id, name))), profiles!visit_schedules_assigned_to_fkey(id, full_name)`
    )
    .is('deleted_at', null)
    .eq('scheduled_date', date)
    .in('status', ['scheduled', 'in_progress'])
    .order('visit_order', { ascending: true, nullsFirst: false })

  return (data ?? []) as ScheduleWithCoords[]
}

export async function geocodeHouseholdAction(
  householdId: string,
  address: string
): Promise<ActionResult<{ lat: number; lng: number }>> {
  const supabase = createClient()

  const restKey = process.env.KAKAO_REST_API_KEY
  if (!restKey) return { success: false, error: '지오코딩 API 키가 설정되지 않았습니다' }
  if (!address.trim()) return { success: false, error: '주소가 없습니다' }

  // 우편번호 제거: [12345] 또는 (12345) 패턴
  const cleanAddress = address.replace(/^[\[(]\d{5}[\])]\s*/, '').trim()
  // 도로명 번지까지만 추출: (괄호) 이후 건물명·호수 제거
  const shortAddress = cleanAddress.replace(/\s*[\(（].*$/, '').trim()

  console.log('[geocode] original:', address)
  console.log('[geocode] clean:', cleanAddress)
  console.log('[geocode] short:', shortAddress)
  console.log('[geocode] key set:', !!restKey)

  const headers = { Authorization: `KakaoAK ${restKey}` }
  let doc: { y: string; x: string } | undefined

  async function kakaoSearch(query: string) {
    const addrRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
      { headers }
    )
    const addrData: { documents?: { y: string; x: string }[]; error_type?: string } = await addrRes.json()
    console.log('[geocode] addr search result for:', query, '→ count:', addrData.documents?.length ?? 0, addrData.error_type ?? '')
    if (addrData.documents?.[0]) return addrData.documents[0]

    const kwRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
      { headers }
    )
    const kwData: { documents?: { y: string; x: string }[]; error_type?: string } = await kwRes.json()
    console.log('[geocode] keyword search result for:', query, '→ count:', kwData.documents?.length ?? 0, kwData.error_type ?? '')
    return kwData.documents?.[0]
  }

  try {
    doc = await kakaoSearch(cleanAddress)
    if (!doc && shortAddress !== cleanAddress) {
      doc = await kakaoSearch(shortAddress)
    }
  } catch (e) {
    console.error('[geocode] fetch error:', e)
    return { success: false, error: '지오코딩 요청에 실패했습니다' }
  }

  if (!doc) return { success: false, error: '주소를 찾을 수 없습니다' }

  const lat = parseFloat(doc.y)
  const lng = parseFloat(doc.x)

  const { error } = await supabase
    .from('households')
    .update({
      latitude: lat,
      longitude: lng,
      geocoded_at: new Date().toISOString(),
    })
    .eq('id', householdId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/route')
  return { success: true, data: { lat, lng } }
}

export async function saveRouteAction(
  payload: SaveRoutePayload
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  // visit_routes 저장
  const { data: route, error: routeError } = await supabase
    .from('visit_routes')
    .insert({
      route_date: payload.routeDate,
      ordered_schedule_ids: payload.orderedScheduleIds,
      total_distance_m: payload.totalDistanceM,
      optimization_algo: 'nearest_neighbor',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (routeError) return { success: false, error: routeError.message }

  // visit_schedules의 visit_order 업데이트
  const updates = payload.orderedScheduleIds.map((id, idx) =>
    supabase
      .from('visit_schedules')
      .update({ visit_order: idx + 1 })
      .eq('id', id)
  )
  await Promise.all(updates)

  revalidatePath('/route')
  revalidatePath('/schedule')
  return { success: true, data: { id: route.id } }
}
