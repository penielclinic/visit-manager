'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteHouseholdAction } from '@/app/(dashboard)/households/actions'
import { Trash2 } from 'lucide-react'

interface DeleteHouseholdButtonProps {
  householdId: string
}

export function DeleteHouseholdButton({ householdId }: DeleteHouseholdButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('이 가구를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    startTransition(async () => {
      await deleteHouseholdAction(householdId)
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
