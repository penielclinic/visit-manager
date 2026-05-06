import { Badge } from '@/components/ui/badge'
import { RECORD_STATUS_LABELS, RECORD_STATUS_VARIANT } from '@/types/records'
import type { Enums } from '@/types/database.types'

interface RecordStatusBadgeProps {
  status: Enums<'record_status'>
}

export function RecordStatusBadge({ status }: RecordStatusBadgeProps) {
  return (
    <Badge variant={RECORD_STATUS_VARIANT[status]}>
      {RECORD_STATUS_LABELS[status]}
    </Badge>
  )
}
