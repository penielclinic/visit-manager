'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteScheduleAction } from '@/app/(dashboard)/schedule/actions'
import { Trash2 } from 'lucide-react'

interface DeleteScheduleButtonProps {
  scheduleId: string
}

export function DeleteScheduleButton({ scheduleId }: DeleteScheduleButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('이 심방 일정을 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteScheduleAction(scheduleId)
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-red-500 hover:text-red-700 hover:border-red-300"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
      삭제
    </Button>
  )
}
