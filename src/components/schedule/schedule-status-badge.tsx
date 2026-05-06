import { Badge } from '@/components/ui/badge'
import {
  VISIT_STATUS_LABELS,
  VISIT_STATUS_VARIANT,
} from '@/types/schedules'
import type { Enums } from '@/types/database.types'

interface ScheduleStatusBadgeProps {
  status: Enums<'visit_status'>
}

export function ScheduleStatusBadge({ status }: ScheduleStatusBadgeProps) {
  return (
    <Badge variant={VISIT_STATUS_VARIANT[status]}>
      {VISIT_STATUS_LABELS[status]}
    </Badge>
  )
}
