// 카카오맵 JavaScript SDK 최소 타입 선언
// 실제 사용하는 API만 포함

declare namespace kakao.maps {
  function load(callback: () => void): void

  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    setBounds(bounds: LatLngBounds, padding?: number): void
    setLevel(level: number): void
    getLevel(): number
    relayout(): void
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class LatLngBounds {
    constructor()
    extend(latlng: LatLng): void
    isEmpty(): boolean
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    getPosition(): LatLng
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    open(map: Map, marker: Marker): void
    close(): void
  }

  class Polyline {
    constructor(options: PolylineOptions)
    setMap(map: Map | null): void
    getLength(): number
  }

  interface MapOptions {
    center: LatLng
    level: number
  }

  interface MarkerOptions {
    position: LatLng
    map?: Map
    title?: string
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: string | HTMLElement
    map?: Map
    yAnchor?: number
  }

  interface InfoWindowOptions {
    content: string
    removable?: boolean
  }

  interface PolylineOptions {
    path: LatLng[]
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: string
    map?: Map
  }
}

interface Window {
  kakao: typeof kakao
}
