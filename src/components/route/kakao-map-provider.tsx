'use client'

import Script from 'next/script'
import { createContext, useContext, useState } from 'react'

interface KakaoMapContextType {
  isLoaded: boolean
  error: string | null
}

const KakaoMapContext = createContext<KakaoMapContextType>({ isLoaded: false, error: null })

export function KakaoMapProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

  if (!apiKey) {
    return (
      <KakaoMapContext.Provider value={{ isLoaded: false, error: 'NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 없습니다.' }}>
        {children}
      </KakaoMapContext.Provider>
    )
  }

  return (
    <KakaoMapContext.Provider value={{ isLoaded, error }}>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.kakao.maps.load(() => setIsLoaded(true))
          } catch (e) {
            setError('카카오 지도 초기화 실패: ' + String(e))
          }
        }}
        onError={() => {
          setError('카카오 지도 스크립트 로드 실패. API 키 또는 도메인 등록을 확인해주세요.')
        }}
      />
      {children}
    </KakaoMapContext.Provider>
  )
}

export function useKakaoMap() {
  return useContext(KakaoMapContext)
}
