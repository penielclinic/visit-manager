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
    .order('scheduled_time', { ascending: true, nullsFirst: false })

  return (data ?? []) as ScheduleWithCoords[]
}

export async function geocodeHouseholdAction(
  householdId: string,
  _address: string
): Promise<ActionResult<{ lat: number; lng: number }>> {
  const supabase = createClient()

  const restKey = process.env.KAKAO_REST_API_KEY
  if (!restKey) return { success: false, error: '지오코딩 API 키가 설정되지 않았습니다' }

  // DB에서 address_full + address_detail 직접 조회
  const { data: household } = await supabase
    .from('households')
    .select('address_full, address_detail')
    .eq('id', householdId)
    .single()
  const addrFull = household?.address_full ?? _address
  const addrDetail = household?.address_detail ?? ''
  if (!addrFull?.trim()) return { success: false, error: '주소가 없습니다' }

  // 우편번호 제거: [48263], [612021], [613-102] 등
  const cleanFull = addrFull.replace(/^[\[(]\d{3,6}[-]?\d{0,3}[\])]\s*/, '').trim()
  // 도로명 번지까지만: (괄호) 이후 제거
  const shortAddress = cleanFull.replace(/\s*[\(（].*$/, '').trim()
  // address_full + address_detail 결합
  const fullWithDetail = addrDetail ? `${cleanFull} ${addrDetail}` : cleanFull
  // 건물명 추출: address_detail에서 호수 제거 (예: "대동레미안센트럴시티 503호" → "대동레미안센트럴시티")
  const buildingName = addrDetail
    ? addrDetail.replace(/\s*\d+동?\s*\d*호?\s*$/, '').trim()
    : undefined

  const headers = { Authorization: `KakaoAK ${restKey}` }
  let doc: { y: string; x: string } | undefined

  async function kakaoAddrSearch(query: string) {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
      { headers }
    )
    const data: { documents?: { y: string; x: string }[] } = await res.json()
    return data.documents?.[0]
  }

  async function kakaoKeywordSearch(query: string) {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
      { headers }
    )
    const data: { documents?: { y: string; x: string }[] } = await res.json()
    return data.documents?.[0]
  }

  try {
    // 1차: address_full + address_detail 결합 (키워드 검색)
    if (fullWithDetail !== cleanFull) {
      doc = await kakaoKeywordSearch(fullWithDetail)
    }
    // 2차: address_full 주소 검색
    if (!doc) doc = await kakaoAddrSearch(cleanFull)
    // 3차: address_full 키워드 검색
    if (!doc) doc = await kakaoKeywordSearch(cleanFull)
    // 4차: 도로명 번지만 (주소 검색)
    if (!doc && shortAddress !== cleanFull) {
      doc = await kakaoAddrSearch(shortAddress)
    }
    // 5차: 건물명으로 키워드 검색 (예: "대동레미안센트럴시티")
    if (!doc && buildingName) {
      doc = await kakaoKeywordSearch(buildingName)
    }
  } catch (e) {
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
