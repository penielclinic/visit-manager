'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteRecordAction } from '@/app/(dashboard)/records/actions'

interface DeleteRecordButtonProps {
  id: string
}

export function DeleteRecordButton({ id }: DeleteRecordButtonProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleDelete() {
    if (!confirm('이 기록을 휴지통으로 이동하시겠습니까?')) return
    setError('')
    startTransition(async () => {
      const result = await deleteRecordAction(id)
      if (result && !result.success) setError(result.error)
    })
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-2" />
        )}
        휴지통으로 이동
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
