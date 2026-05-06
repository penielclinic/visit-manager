import type { Tables, Enums } from './database.types'

export type VisitRecord = Tables<'visit_records'>

export type RecordWithRelations = VisitRecord & {
  households: {
    id: string
    household_name: string
    representative_name: string
    cells: {
      id: string
      name: string
      districts: { id: string; name: string } | null
    } | null
  }
  profiles: {
    id: string
    full_name: string
  } | null
}

export const RECORD_STATUS_LABELS: Record<Enums<'record_status'>, string> = {
  draft: '임시저장',
  final: '완료',
}

export const RECORD_STATUS_VARIANT: Record<
  Enums<'record_status'>,
  'default' | 'secondary' | 'outline'
> = {
  draft: 'secondary',
  final: 'default',
}

export const VISIT_TYPE_LABELS: Record<Enums<'visit_type'>, string> = {
  regular: '정기심방',
  special: '특별심방',
  new_member: '새신자심방',
  follow_up: '후속심방',
}
