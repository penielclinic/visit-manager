import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function tryGeocode(
  address: string,
  headers: Record<string, string>
): Promise<{ lat: number; lng: number } | null> {
  // 우편번호 제거
  const clean = address.replace(/^[\[(]\d{5,6}[\])]\s*/, '').trim()
  // 도로명만
  const short = clean.replace(/\s*[\(（].*$/, '').trim()
  // 아파트명 추출: 숫자동 숫자호 등 제거
  const bldg = clean
    .replace(/^.*\)\s*/, '') // ") " 뒤만
    .replace(/\s*\d+동?\s*\d*[-/]?\d*호?\s*$/, '')
    .trim()
  // 동 주소에서 아파트명 추출 (예: "좌4동 두산동국아파트 102동 502호")
  const inlineBldg = clean
    .replace(/\s*\d+동\s*\d*호?\s*$/, '')
    .replace(/^.*동\s+/, '')
    .trim()

  const queries = [clean, short]
  if (bldg && bldg !== clean && bldg !== short) queries.push(bldg)
  if (inlineBldg && inlineBldg.length > 2 && !queries.includes(inlineBldg)) queries.push(inlineBldg)

  for (const q of queries) {
    // 주소 검색
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}`,
        { headers }
      )
      const data = await res.json()
      if (data.documents?.[0]) {
        return { lat: parseFloat(data.documents[0].y), lng: parseFloat(data.documents[0].x) }
      }
    } catch {}

    // 키워드 검색
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}`,
        { headers }
      )
      const data = await res.json()
      if (data.documents?.[0]) {
        return { lat: parseFloat(data.documents[0].y), lng: parseFloat(data.documents[0].x) }
      }
    } catch {}
  }

  return null
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const restKey = process.env.KAKAO_REST_API_KEY
  if (!restKey) {
    return NextResponse.json({ error: 'KAKAO_REST_API_KEY 미설정' }, { status: 500 })
  }

  const headers = { Authorization: `KakaoAK ${restKey}` }

  // 좌표 없는 가구 전체 조회
  const { data: households } = await supabase
    .from('households')
    .select('id, household_name, address_full, address_detail')
    .is('latitude', null)
    .is('deleted_at', null)

  if (!households || households.length === 0) {
    return NextResponse.json({ message: '좌표 없는 가구 없음', results: [] })
  }

  const results: { name: string; status: string; lat?: number; lng?: number; tried?: string }[] = []

  for (const h of households) {
    const fullAddr = [h.address_full, h.address_detail].filter(Boolean).join(' ')
    if (!fullAddr.trim()) {
      results.push({ name: h.household_name, status: 'no_address' })
      continue
    }

    const coords = await tryGeocode(fullAddr, headers)
    if (coords) {
      await supabase
        .from('households')
        .update({ latitude: coords.lat, longitude: coords.lng, geocoded_at: new Date().toISOString() })
        .eq('id', h.id)
      results.push({ name: h.household_name, status: 'ok', lat: coords.lat, lng: coords.lng })
    } else {
      // address_detail만으로도 시도
      if (h.address_detail) {
        const detailCoords = await tryGeocode(h.address_detail, headers)
        if (detailCoords) {
          await supabase
            .from('households')
            .update({ latitude: detailCoords.lat, longitude: detailCoords.lng, geocoded_at: new Date().toISOString() })
            .eq('id', h.id)
          results.push({ name: h.household_name, status: 'ok_detail', lat: detailCoords.lat, lng: detailCoords.lng })
          continue
        }
      }
      results.push({ name: h.household_name, status: 'fail', tried: fullAddr })
    }
  }

  const okCount = results.filter(r => r.status.startsWith('ok')).length
  return NextResponse.json({
    message: `${okCount}/${results.length} 성공`,
    results,
  })
}
