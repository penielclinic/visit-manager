import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // 인증 확인
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { address, householdId } = await req.json().catch(() => ({}))
  if (!address) {
    return NextResponse.json({ error: '주소가 필요합니다' }, { status: 400 })
  }

  const restKey = process.env.KAKAO_REST_API_KEY
  if (!restKey) {
    return NextResponse.json({ error: '지오코딩 API 키가 설정되지 않았습니다' }, { status: 500 })
  }

  // 카카오 주소 검색 REST API
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`
  const kakaoRes = await fetch(url, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  })

  if (!kakaoRes.ok) {
    return NextResponse.json(
      { error: `카카오 API 오류: ${kakaoRes.status}` },
      { status: 502 }
    )
  }

  const kakaoData = await kakaoRes.json()
  const doc = kakaoData.documents?.[0]
  if (!doc) {
    return NextResponse.json({ error: '주소를 찾을 수 없습니다' }, { status: 404 })
  }

  const lat = parseFloat(doc.y)
  const lng = parseFloat(doc.x)

  // householdId가 전달되면 DB 업데이트
  if (householdId) {
    await supabase
      .from('households')
      .update({
        latitude: lat,
        longitude: lng,
        geocoded_at: new Date().toISOString(),
      })
      .eq('id', householdId)
  }

  return NextResponse.json({ lat, lng })
}
