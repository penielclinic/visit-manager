'use client'

import { useEffect, useRef } from 'react'
import { useKakaoMap } from './kakao-map-provider'
import type { RouteNode } from '@/types/routes'
import { MapPin } from 'lucide-react'

const CHURCH = {
  lat: parseFloat(process.env.NEXT_PUBLIC_CHURCH_LAT ?? '35.1631'),
  lng: parseFloat(process.env.NEXT_PUBLIC_CHURCH_LNG ?? '129.1635'),
  name: process.env.NEXT_PUBLIC_CHURCH_NAME ?? '교회',
}

interface VisitMapProps {
  nodes: RouteNode[]
  height?: string
}

// 교회 마커 오버레이 HTML
function makeChurchOverlay(name: string) {
  return `
    <div style="
      position:relative;
      display:inline-flex;
      flex-direction:column;
      align-items:center;
      cursor:default;
    ">
      <div style="
        background:#dc2626;
        color:#fff;
        font-size:14px;
        font-weight:700;
        width:32px;height:32px;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      ">✟</div>
      <div style="
        background:rgba(220,38,38,0.85);
        color:#fff;
        font-size:11px;
        padding:2px 8px;
        border-radius:4px;
        margin-top:3px;
        white-space:nowrap;
      ">${name}</div>
    </div>
  `
}

// 순서 번호 오버레이 HTML
function makeOverlayContent(order: number, name: string) {
  return `
    <div style="
      position:relative;
      display:inline-flex;
      flex-direction:column;
      align-items:center;
      cursor:default;
    ">
      <div style="
        background:#2563eb;
        color:#fff;
        font-size:12px;
        font-weight:700;
        width:28px;height:28px;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:2px solid #fff;
        box-shadow:0 2px 4px rgba(0,0,0,0.3);
      ">${order}</div>
      <div style="
        background:rgba(0,0,0,0.75);
        color:#fff;
        font-size:11px;
        padding:2px 6px;
        border-radius:4px;
        margin-top:3px;
        white-space:nowrap;
        max-width:100px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${name}</div>
    </div>
  `
}

export function VisitMap({ nodes, height = '480px' }: VisitMapProps) {
  const { isLoaded } = useKakaoMap()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([])
  const polylineRef = useRef<kakao.maps.Polyline | null>(null)

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return
    if (!mapRef.current) {
      const center = nodes.length > 0
        ? new kakao.maps.LatLng(nodes[0].lat, nodes[0].lng)
        : new kakao.maps.LatLng(35.1631, 129.1636) // 해운대 기본값
      mapRef.current = new kakao.maps.Map(containerRef.current, {
        center,
        level: 5,
      })
    }
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const map = mapRef.current

    // 기존 오버레이 / 폴리라인 제거
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []
    polylineRef.current?.setMap(null)
    polylineRef.current = null

    const bounds = new kakao.maps.LatLngBounds()
    const churchPos = new kakao.maps.LatLng(CHURCH.lat, CHURCH.lng)

    // 교회 마커 항상 표시
    bounds.extend(churchPos)
    const churchOverlay = new kakao.maps.CustomOverlay({
      position: churchPos,
      content: makeChurchOverlay(CHURCH.name),
      map,
      yAnchor: 1,
    })
    overlaysRef.current.push(churchOverlay)

    if (nodes.length === 0) {
      map.setBounds(bounds, 60)
      return
    }

    nodes.forEach((node) => {
      const pos = new kakao.maps.LatLng(node.lat, node.lng)
      bounds.extend(pos)

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: makeOverlayContent(node.visitOrder, node.householdName),
        map,
        yAnchor: 1,
      })
      overlaysRef.current.push(overlay)
    })

    // 경로 폴리라인: 교회 → 첫 번째 노드 → ... → 마지막 노드
    const pathPoints = [
      churchPos,
      ...nodes.map((n) => new kakao.maps.LatLng(n.lat, n.lng)),
    ]
    polylineRef.current = new kakao.maps.Polyline({
      path: pathPoints,
      strokeWeight: 3,
      strokeColor: '#2563eb',
      strokeOpacity: 0.7,
      strokeStyle: 'solid',
      map,
    })

    map.setBounds(bounds, 60)
  }, [isLoaded, nodes])

  if (!isLoaded) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center bg-slate-100 rounded-xl text-slate-400 gap-2"
      >
        <MapPin className="w-8 h-8 animate-pulse" />
        <p className="text-sm" style={{ wordBreak: 'keep-all' }}>
          지도 로딩 중...
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-slate-200"
    />
  )
}
