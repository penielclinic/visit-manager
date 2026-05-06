import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { AiClassifyRequest, AiClassifyResponse, AiClassifyResult } from '@/types/voice'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `당신은 한국 교회 심방 기록을 정리하는 전문 비서입니다.
주어진 심방 음성 녹취록을 다음 4가지 항목으로 분류하여 JSON으로만 응답하세요.
다른 텍스트 없이 유효한 JSON만 반환합니다.

{
  "content": "심방에서 나눈 주요 대화 내용, 기도 제목 공유, 신앙 상태 등 일반적인 심방 내용",
  "special_notes": "건강 문제, 가정 위기, 경제적 어려움, 갈등 등 특별히 주의가 필요한 사항. 없으면 빈 문자열",
  "ai_summary": "전체 심방을 2~3문장으로 요약한 내용",
  "ai_follow_up": "다음 심방 전 담당자가 취해야 할 구체적인 후속 조치. 없으면 빈 문자열"
}`

export async function POST(
  req: NextRequest
): Promise<NextResponse<AiClassifyResponse>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  let body: AiClassifyRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 형식이 잘못되었습니다' },
      { status: 400 }
    )
  }

  const { transcript, householdId, recordId } = body
  if (!transcript?.trim()) {
    return NextResponse.json(
      { success: false, error: '녹취 내용이 비어있습니다' },
      { status: 400 }
    )
  }

  // voice_recordings 레코드 생성 (processing 상태)
  const { data: voiceRec, error: insertError } = await supabase
    .from('voice_recordings')
    .insert({
      record_id: recordId,
      household_id: householdId,
      uploaded_by: user.id,
      file_name: `web-speech-${Date.now()}.txt`,
      storage_path: 'web-speech-api',
      mime_type: 'text/plain',
      transcript: transcript,
      status: 'processing',
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json(
      { success: false, error: insertError.message },
      { status: 500 }
    )
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `다음 심방 녹취록을 분류해주세요:\n\n${transcript}`,
        },
      ],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다')

    const result: AiClassifyResult = JSON.parse(jsonMatch[0])

    await supabase
      .from('voice_recordings')
      .update({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ai_result: result as any,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', voiceRec.id)

    return NextResponse.json({
      success: true,
      data: result,
      voiceRecordingId: voiceRec.id,
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : '알 수 없는 오류'

    await supabase
      .from('voice_recordings')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('id', voiceRec.id)

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
