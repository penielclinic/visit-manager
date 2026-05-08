import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return NextResponse.json({ error: 'KAKAO_REST_API_KEY 미설정' })

  // 서울시청 주소로 테스트 (반드시 결과가 나오는 주소)
  const testAddr = '서울 중구 세종대로 110'
  const addrRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(testAddr)}`,
    { headers: { Authorization: `KakaoAK ${key}` } }
  )
  const addrBody = await addrRes.json()

  // 키워드 검색도 테스트
  const kwRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent('광안자이아파트')}`,
    { headers: { Authorization: `KakaoAK ${key}` } }
  )
  const kwBody = await kwRes.json()

  return NextResponse.json({
    keyLength: key.length,
    keyPrefix: key.substring(0, 4) + '...',
    addressTest: {
      query: testAddr,
      httpStatus: addrRes.status,
      documentCount: addrBody.documents?.length ?? 0,
      errorType: addrBody.errorType ?? null,
      errorMessage: addrBody.message ?? null,
      firstResult: addrBody.documents?.[0] ? { y: addrBody.documents[0].y, x: addrBody.documents[0].x } : null,
    },
    keywordTest: {
      query: '광안자이아파트',
      httpStatus: kwRes.status,
      documentCount: kwBody.documents?.length ?? 0,
      errorType: kwBody.errorType ?? null,
      errorMessage: kwBody.message ?? null,
      firstResult: kwBody.documents?.[0] ? { y: kwBody.documents[0].y, x: kwBody.documents[0].x } : null,
    },
  })
}
