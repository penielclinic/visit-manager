'use client'

import Script from 'next/script'
import { createContext, useContext, useState } from 'react'

interface KakaoMapContextType {
  isLoaded: boolean
}

const KakaoMapContext = createContext<KakaoMapContextType>({ isLoaded: false })

export function KakaoMapProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <KakaoMapContext.Provider value={{ isLoaded }}>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(() => setIsLoaded(true))
        }}
      />
      {children}
    </KakaoMapContext.Provider>
  )
}

export function useKakaoMap() {
  return useContext(KakaoMapContext)
}
