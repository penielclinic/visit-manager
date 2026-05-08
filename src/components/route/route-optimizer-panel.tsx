'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RouteList } from './route-list'
import {
  getSchedulesForDate,
  saveRouteAction,
  geocodeHouseholdAction,
} from '@/app/(dashboard)/route/actions'
import {
  schedulesToNodes,
  nearestNeighborTSP,
  calcTotalDistance,
} from '@/lib/route-optimizer'
import type { ScheduleWithCoords, RouteNode } from '@/types/routes'
import { Wand2, Save, Loader2, MapPinOff, Church } from 'lucide-react'

const CHURCH_START = {
  lat: parseFloat(process.env.NEXT_PUBLIC_CHURCH_LAT ?? '35.1631'),
  lng: parseFloat(process.env.NEXT_PUBLIC_CHURCH_LNG ?? '129.1635'),
}

interface RouteOptimizerPanelProps {
  initialSchedules: ScheduleWithCoords[]
  initialDate: string
  onNodesChange: (nodes: RouteNode[]) => void
}

function formatDistance(m: number) {
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
}

export function RouteOptimizerPanel({
  initialSchedules,
  initialDate,
  onNodesChange,
}: RouteOptimizerPanelProps) {
  const [date, setDate] = useState(initialDate)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [nodes, setNodes] = useState<RouteNode[]>([])
  const [totalDist, setTotalDist] = useState(0)
  const [saveMsg, setSaveMsg] = useState('')

  const [datePending, startDateTransition] = useTransition()
  const [savePending, startSaveTransition] = useTransition()
  const [geocodeAllPending, setGeocodeAllPending] = useState(false)
  const [geocodeProgress, setGeocodeProgress] = useState('')

  // 모든 일정 (좌표 유무 포함)
  const allScheduleItems = schedules.map((s) => ({
    id: s.id,
    householdId: s.household_id,
    householdName: s.households.household_name,
    representativeName: s.households.representative_name,
    address: s.households.address_full,
    hasCoords:
      s.households.latitude != null && s.households.longitude != null,
  }))

  function handleDateChange(newDate: string) {
    setDate(newDate)
    setNodes([])
    setTotalDist(0)
    setSaveMsg('')
    onNodesChange([])
    startDateTransition(async () => {
      const data = await getSchedulesForDate(newDate)
      setSchedules(data)
    })
  }

  function handleOptimize() {
    const raw = schedulesToNodes(schedules)
    const optimized = nearestNeighborTSP(raw)
    const dist = calcTotalDistance(optimized, CHURCH_START)
    setNodes(optimized)
    setTotalDist(dist)
    setSaveMsg('')
    onNodesChange(optimized)
  }

  function handleNodesChange(updated: RouteNode[]) {
    const dist = calcTotalDistance(updated, CHURCH_START)
    setNodes(updated)
    setTotalDist(dist)
    onNodesChange(updated)
  }

  async function handleGeocodeAll() {
    const missing = schedules.filter(
      (s) =>
        s.households.latitude == null &&
        s.households.address_full
    )
    if (missing.length === 0) return
    setGeocodeAllPending(true)
    setGeocodeProgress('')
    let done = 0
    for (const s of missing) {
      setGeocodeProgress(`변환 중... ${done}/${missing.length}`)
      const result = await geocodeHouseholdAction(
        s.household_id,
        s.households.address_full!
      )
      if (result.success) {
        handleGeocode(s.household_id, result.data.lat, result.data.lng)
      }
      done++
    }
    setGeocodeProgress(`완료 (${done}/${missing.length})`)
    setGeocodeAllPending(false)
  }

  function handleGeocode(householdId: string, lat: number, lng: number) {
    // 좌표 업데이트 후 schedules 상태 갱신 (재조회 없이 in-place 업데이트)
    setSchedules((prev) =>
      prev.map((s) =>
        s.household_id === householdId
          ? {
              ...s,
              households: { ...s.households, latitude: lat, longitude: lng },
            }
          : s
      )
    )
  }

  function handleSave() {
    if (nodes.length === 0) return
    setSaveMsg('')
    startSaveTransition(async () => {
      const result = await saveRouteAction({
        routeDate: date,
        orderedScheduleIds: nodes.map((n) => n.scheduleId),
        totalDistanceM: totalDist,
      })
      setSaveMsg(result.success ? '저장 완료!' : result.error)
    })
  }

  const hasCoordCount = allScheduleItems.filter((s) => s.hasCoords).length
  const noCoordCount = allScheduleItems.length - hasCoordCount

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* 날짜 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="route-date">날짜</Label>
        <Input
          id="route-date"
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={datePending}
        />
      </div>

      {/* 일정 요약 */}
      {datePending ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>일정 불러오는 중...</span>
        </div>
      ) : (
        <div className="text-sm text-slate-500 space-y-0.5">
          <p>
            전체 일정{' '}
            <strong className="text-slate-800">{schedules.length}</strong>개
          </p>
          {noCoordCount > 0 && (
            <p className="text-amber-600">
              좌표 없음 <strong>{noCoordCount}</strong>개 (경로 제외)
            </p>
          )}
          {hasCoordCount > 0 && (
            <p className="text-green-600">
              경로 최적화 가능 <strong>{hasCoordCount}</strong>개
            </p>
          )}
        </div>
      )}

      {/* 일괄 좌표 변환 버튼 */}
      {noCoordCount > 0 && (
        <div className="space-y-1">
          <Button
            onClick={handleGeocodeAll}
            disabled={geocodeAllPending || datePending}
            variant="outline"
            className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            {geocodeAllPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MapPinOff className="w-4 h-4 mr-2" />
            )}
            전체 좌표 변환 ({noCoordCount}개)
          </Button>
          {geocodeProgress && (
            <p className="text-xs text-center text-slate-500">{geocodeProgress}</p>
          )}
        </div>
      )}

      {/* 최적화 버튼 */}
      <Button
        onClick={handleOptimize}
        disabled={hasCoordCount === 0 || datePending}
        className="w-full"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        최적 경로 계산
      </Button>

      {/* 거리 정보 */}
      {nodes.length > 0 && (
        <div className="text-xs text-slate-500 text-center space-y-0.5">
          <p className="flex items-center justify-center gap-1">
            <Church className="w-3 h-3" />
            <span>교회 출발 → 총 예상 이동 거리:</span>
          </p>
          <p>
            <strong className="text-slate-800 text-sm">{formatDistance(totalDist)}</strong>
          </p>
        </div>
      )}

      {/* 경로 목록 (드래그 정렬) */}
      <RouteList
        nodes={nodes}
        allSchedules={allScheduleItems}
        onChange={handleNodesChange}
        onGeocode={handleGeocode}
      />

      {/* 저장 */}
      {nodes.length > 0 && (
        <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
          <Button
            onClick={handleSave}
            disabled={savePending}
            variant="outline"
            className="w-full"
          >
            {savePending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            경로 저장 (심방 순서 반영)
          </Button>
          {saveMsg && (
            <p
              className={`text-xs text-center ${
                saveMsg === '저장 완료!'
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}
              style={{ wordBreak: 'keep-all' }}
            >
              {saveMsg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
