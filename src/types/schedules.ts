import type { Tables, Enums } from './database.types'

export type VisitSchedule = Tables<'visit_schedules'>
export type Profile = Tables<'profiles'>

// 목록·상세 페이지용 조인 타입
export type ScheduleWithRelations = VisitSchedule & {
  households: {
    id: string
    household_name: string
    representative_name: string
    cells: {
      id: string
      name: string
      districts: { id: string; name: string }
    } | null
  }
  profiles: { id: string; full_name: string } | null // assigned_to
}

// 폼 입력값 타입
export type ScheduleFormValues = {
  household_id: string
  scheduled_date: string       // 'YYYY-MM-DD'
  scheduled_time: string       // 'HH:MM' or ''
  visit_type: Enums<'visit_type'>
  status: Enums<'visit_status'>
  assigned_to: string          // profile id or ''
  memo: string
  visit_order: string          // number string or ''
}

// 라벨 맵
export const VISIT_TYPE_LABELS: Record<Enums<'visit_type'>, string> = {
  regular: '정기',
  special: '특별',
  new_member: '새신자',
  follow_up: '후속',
}

export const VISIT_STATUS_LABELS: Record<Enums<'visit_status'>, string> = {
  scheduled: '예정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
  postponed: '연기',
}

export const VISIT_STATUS_VARIANT: Record<
  Enums<'visit_status'>,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  scheduled: 'default',
  in_progress: 'secondary',
  completed: 'outline',
  cancelled: 'destructive',
  postponed: 'secondary',
}
