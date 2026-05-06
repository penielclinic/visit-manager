'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trash2, Loader2 } from 'lucide-react'
import {
  restoreRecordAction,
  permanentDeleteRecordAction,
} from '@/app/(dashboard)/records/actions'

interface TrashRecordActionsProps {
  id: string
}

export function TrashRecordActions({ id }: TrashRecordActionsProps) {
  const [restorePending, startRestore] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [error, setError] = useState('')

  function handleRestore() {
    setError('')
    startRestore(async () => {
      const result = await restoreRecordAction(id)
      if (!result.success) setError(result.error)
    })
  }

  function handlePermanentDelete() {
    if (!confirm('영구 삭제하면 복구할 수 없습니다. 계속하시겠습니까?')) return
    setError('')
    startDelete(async () => {
      const result = await permanentDeleteRecordAction(id)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={restorePending || deletePending}
      >
        {restorePending ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4 mr-1" />
        )}
        복원
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePermanentDelete}
        disabled={restorePending || deletePending}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        {deletePending ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-1" />
        )}
        영구 삭제
      </Button>
      {error && <p className="text-xs text-red-500 ml-2">{error}</p>}
    </div>
  )
}
