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

  // 아파트 단지명 추출: ") 단지명 N호" 패턴에서 단지명 추출
  // 예) "(청강리) 대동레미안센트럴시티 503호" → "대동레미안센트럴시티"
  const buildingMatch = cleanAddress.match(/\)\s+([가-힣A-Za-z0-9]+(?:\s+[가-힣A-Za-z0-9]+)*?)(?:\s+\d+동)?(?:\s+\d+호)?\s*$/)
  const buildingName = buildingMatch?.[1]?.trim()

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
    // 1차: 전체 주소 (주소 검색)
    doc = await kakaoAddrSearch(cleanAddress)
    // 2차: 전체 주소 (키워드 검색)
    if (!doc) doc = await kakaoKeywordSearch(cleanAddress)
    // 3차: 도로명 번지만 (건물명 제거)
    if (!doc && shortAddress !== cleanAddress) {
      doc = await kakaoAddrSearch(shortAddress)
    }
    // 4차: 아파트 단지명으로 키워드 검색
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
