'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { RouteNode } from '@/types/routes'
import { GripVertical, MapPin, Church, ArrowDown } from 'lucide-react'
import { GeocodeStatusBadge } from './geocode-status-badge'

interface RouteListProps {
  nodes: RouteNode[]
  segmentDists?: number[]
  allSchedules: {
    id: string
    householdId: string
    householdName: string
    representativeName: string
    address: string | null
    hasCoords: boolean
  }[]
  onChange: (nodes: RouteNode[]) => void
  onGeocode?: (householdId: string, lat: number, lng: number) => void
}

function formatDist(m: number) {
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
}

function DistanceConnector({ dist }: { dist: number }) {
  return (
    <div className="flex flex-col items-center py-0.5 select-none pointer-events-none">
      <div className="w-px h-2 bg-slate-200" />
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        <ArrowDown className="w-3 h-3" />
        <span className="text-xs font-medium">{formatDist(dist)}</span>
      </div>
      <div className="w-px h-2 bg-slate-200" />
    </div>
  )
}

function SortableItem({ node }: { node: RouteNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.scheduleId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-2.5 px-3 bg-white border border-slate-200 rounded-lg"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-300 hover:text-slate-500 flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {node.visitOrder}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium whitespace-nowrap">{node.householdName}</p>
        {node.address && (
          <p className="text-xs text-slate-400 truncate">{node.address}</p>
        )}
      </div>
    </div>
  )
}

export function RouteList({ nodes, segmentDists, allSchedules, onChange, onGeocode }: RouteListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = nodes.findIndex((n) => n.scheduleId === active.id)
    const newIndex = nodes.findIndex((n) => n.scheduleId === over.id)
    const reordered = arrayMove(nodes, oldIndex, newIndex).map((n, i) => ({
      ...n,
      visitOrder: i + 1,
    }))
    onChange(reordered)
  }

  const noCoords = allSchedules.filter((s) => !s.hasCoords)
  const hasSegs = segmentDists && segmentDists.length > 0

  return (
    <div className="space-y-3">
      {/* 좌표 없는 가구 경고 */}
      {noCoords.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
          <p className="text-xs font-medium text-amber-700" style={{ wordBreak: 'keep-all' }}>
            좌표가 없어 경로 최적화에서 제외된 가구 ({noCoords.length}개)
          </p>
          {noCoords.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 whitespace-nowrap flex-1 truncate">
                {s.householdName}
              </span>
              <GeocodeStatusBadge
                householdId={s.householdId}
                address={s.address}
                hasCoords={false}
                onSuccess={(lat, lng) => onGeocode?.(s.householdId, lat, lng)}
              />
            </div>
          ))}
        </div>
      )}

      {/* 정렬 가능한 목록 */}
      {nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-300">
          <MapPin className="w-8 h-8 mb-2" />
          <p className="text-sm" style={{ wordBreak: 'keep-all' }}>
            좌표가 있는 일정이 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* 교회 출발점 */}
          {hasSegs && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <Church className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-red-700 whitespace-nowrap">교회 출발</span>
              </div>
              <DistanceConnector dist={segmentDists![0]} />
            </>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={nodes.map((n) => n.scheduleId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {nodes.map((node, idx) => (
                  <div key={node.scheduleId}>
                    <SortableItem node={node} />
                    {hasSegs && idx < nodes.length - 1 && (
                      <DistanceConnector dist={segmentDists![idx + 1]} />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}
