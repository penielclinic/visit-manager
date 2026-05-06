import type { Tables } from './database.types'
import type { ScheduleWithRelations } from './schedules'

export type VisitRoute = Tables<'visit_routes'>

// 좌표 정보가 포함된 일정 타입
export type ScheduleWithCoords = Omit<ScheduleWithRelations, 'households'> & {
  households: ScheduleWithRelations['households'] & {
    latitude: number | null
    longitude: number | null
    address_full: string | null
  }
}

// 최적화 경로의 노드 1개
export type RouteNode = {
  scheduleId: string
  householdId: string
  householdName: string
  representativeName: string
  address: string | null
  lat: number
  lng: number
  visitOrder: number
}

export type OptimizeResult = {
  nodes: RouteNode[]
  totalDistanceM: number
}

export type SaveRoutePayload = {
  routeDate: string              // 'YYYY-MM-DD'
  orderedScheduleIds: string[]
  totalDistanceM: number
}
