'use client'

import { useTransition, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { geocodeHouseholdAction } from '@/app/(dashboard)/route/actions'
import { MapPin, Loader2 } from 'lucide-react'

interface GeocodeStatusBadgeProps {
  householdId: string
  address: string | null
  hasCoords: boolean
  onSuccess?: (lat: number, lng: number) => void
}

export function GeocodeStatusBadge({
  householdId,
  address,
  hasCoords,
  onSuccess,
}: GeocodeStatusBadgeProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [done, setDone] = useState(hasCoords)

  if (done) {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-300">
        <MapPin className="w-3 h-3" />
        좌표 있음
      </Badge>
    )
  }

  function handleGeocode() {
    if (!address) return
    setError('')
    startTransition(async () => {
      const result = await geocodeHouseholdAction(householdId, address!)
      if (result.success) {
        setDone(true)
        onSuccess?.(result.data.lat, result.data.lng)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="destructive" className="text-xs gap-1">
        <MapPin className="w-3 h-3" />
        좌표 없음
      </Badge>
      {address && (
        <Button
          size="sm"
          variant="ghost"
          className="h-5 text-xs px-1.5 text-slate-500"
          onClick={handleGeocode}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            '변환'
          )}
        </Button>
      )}
      {error && (
        <span className="text-xs text-red-500 whitespace-nowrap">{error}</span>
      )}
    </div>
  )
}
