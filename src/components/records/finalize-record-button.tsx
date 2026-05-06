'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import {
  finalizeRecordAction,
  completeScheduleAction,
} from '@/app/(dashboard)/records/actions'

interface FinalizeRecordButtonProps {
  id: string
  scheduleId?: string | null
}

export function FinalizeRecordButton({
  id,
  scheduleId,
}: FinalizeRecordButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleFinalize() {
    if (!confirm('기록을 완료 처리하시겠습니까? 완료 후에는 수정할 수 없습니다.'))
      return
    setError('')
    startTransition(async () => {
      const result = await finalizeRecordAction(id)
      if (!result.success) {
        setError(result.error)
        return
      }
      if (scheduleId) {
        await completeScheduleAction(scheduleId)
      }
    })
  }

  return (
    <div className="space-y-1">
      <Button onClick={handleFinalize} disabled={pending} size="sm">
        {pending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4 mr-2" />
        )}
        기록 완료 처리
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
