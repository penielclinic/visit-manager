'use client'

import { useTransition } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateScheduleStatusAction } from '@/app/(dashboard)/schedule/actions'
import type { Enums } from '@/types/database.types'

interface StatusChangeButtonsProps {
  scheduleId: string
  currentStatus: Enums<'visit_status'>
}

type NextAction = {
  status: Enums<'visit_status'>
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}

function getNextActions(current: Enums<'visit_status'>): NextAction[] {
  switch (current) {
    case 'scheduled':
      return [
        { status: 'in_progress', label: '진행 중으로 변경', variant: 'secondary' },
        { status: 'completed', label: '완료 처리', variant: 'default' },
        { status: 'postponed', label: '연기', variant: 'outline' },
        { status: 'cancelled', label: '취소', variant: 'destructive' },
      ]
    case 'in_progress':
      return [
        { status: 'completed', label: '완료 처리', variant: 'default' },
        { status: 'cancelled', label: '취소', variant: 'destructive' },
      ]
    case 'postponed':
      return [
        { status: 'scheduled', label: '예정으로 복원', variant: 'outline' },
        { status: 'cancelled', label: '취소', variant: 'destructive' },
      ]
    case 'cancelled':
      return [
        { status: 'scheduled', label: '예정으로 복원', variant: 'outline' },
      ]
    case 'completed':
      return []
  }
}

export function StatusChangeButtons({
  scheduleId,
  currentStatus,
}: StatusChangeButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const actions = getNextActions(currentStatus)
  if (actions.length === 0) return null

  function handleChange(status: Enums<'visit_status'>) {
    setError('')
    startTransition(async () => {
      const result = await updateScheduleStatusAction(scheduleId, status)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400" style={{ wordBreak: 'keep-all' }}>
        상태 변경
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.status}
            variant={a.variant}
            size="sm"
            disabled={isPending}
            onClick={() => handleChange(a.status)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}
    </div>
  )
}
