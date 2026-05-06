import type { RouteNode, ScheduleWithCoords } from '@/types/routes'

/** 하버사인 공식으로 두 좌표 간 직선거리(m) 계산 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000 // 지구 반지름 (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 정렬된 경로의 총 이동 거리(m) */
export function calcTotalDistance(nodes: RouteNode[]): number {
  let total = 0
  for (let i = 0; i < nodes.length - 1; i++) {
    total += haversineDistance(
      nodes[i].lat,
      nodes[i].lng,
      nodes[i + 1].lat,
      nodes[i + 1].lng
    )
  }
  return Math.round(total)
}

/**
 * Nearest Neighbor 휴리스틱 TSP
 * - 첫 번째 노드를 출발점으로 고정
 * - 미방문 노드 중 현재 위치에서 가장 가까운 곳을 다음으로 선택
 */
export function nearestNeighborTSP(nodes: RouteNode[]): RouteNode[] {
  if (nodes.length <= 1) return nodes.map((n, i) => ({ ...n, visitOrder: i + 1 }))

  const unvisited = new Set(nodes.map((_, i) => i))
  const result: number[] = [0]
  unvisited.delete(0)

  while (unvisited.size > 0) {
    const current = result[result.length - 1]
    let nearest = -1
    let minDist = Infinity

    for (const idx of unvisited) {
      const dist = haversineDistance(
        nodes[current].lat,
        nodes[current].lng,
        nodes[idx].lat,
        nodes[idx].lng
      )
      if (dist < minDist) {
        minDist = dist
        nearest = idx
      }
    }

    result.push(nearest)
    unvisited.delete(nearest)
  }

  return result.map((idx, order) => ({
    ...nodes[idx],
    visitOrder: order + 1,
  }))
}

/** ScheduleWithCoords 배열 → RouteNode 배열 변환 (좌표 없는 항목 제외) */
export function schedulesToNodes(schedules: ScheduleWithCoords[]): RouteNode[] {
  return schedules
    .filter(
      (s) =>
        s.households.latitude != null && s.households.longitude != null
    )
    .map((s, i) => ({
      scheduleId: s.id,
      householdId: s.household_id,
      householdName: s.households.household_name,
      representativeName: s.households.representative_name,
      address: s.households.address_full,
      lat: s.households.latitude!,
      lng: s.households.longitude!,
      visitOrder: i + 1,
    }))
}
