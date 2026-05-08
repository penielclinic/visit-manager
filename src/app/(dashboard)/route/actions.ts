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

  const headers = { Authorization: `KakaoAK ${restKey}` }
  let doc: { y: string; x: string } | undefined

  try {
    // 1차: 주소 검색 API
    const addrRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      { headers }
    )
    const addrData: { documents?: { y: string; x: string }[] } = await addrRes.json()
    doc = addrData.documents?.[0]

    // 2차: 키워드 검색 API (주소 검색 실패 시 폴백)
    if (!doc) {
      const kwRes = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
        { headers }
      )
      const kwData: { documents?: { y: string; x: string }[] } = await kwRes.json()
      doc = kwData.documents?.[0]
    }
  } catch {
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
