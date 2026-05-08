'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintRecordButton({ id }: { id: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/records/${id}/print`, '_blank')}
      className="gap-1.5"
    >
      <Printer className="w-4 h-4" />
      PDF 저장
    </Button>
  )
}
