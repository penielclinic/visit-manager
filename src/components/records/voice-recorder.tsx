'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, CheckCircle2 } from 'lucide-react'
import type { AiClassifyResult } from '@/types/voice'

// Web Speech API — not in standard TypeScript lib
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
  readonly error?: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

type RecorderState = 'idle' | 'recording' | 'classifying' | 'done' | 'error'

interface VoiceRecorderProps {
  householdId: string
  recordId: string
  onClassified: (result: AiClassifyResult) => void
  disabled?: boolean
}

export function VoiceRecorder({
  householdId,
  recordId,
  onClassified,
  disabled,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')
  const committedRef = useRef('') // 이전 세션들에서 확정된 텍스트
  const isRecordingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supported =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setIsSupported(supported)
  }, [])

  function startRecording() {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()

    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    finalTranscriptRef.current = ''
    committedRef.current = ''
    isRecordingRef.current = true
    setTranscript('')
    setInterimText('')
    setErrorMsg('')

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      // 현재 세션의 final 결과를 처음부터 재구성 (중복 방지)
      let sessionFinal = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          sessionFinal += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      finalTranscriptRef.current = committedRef.current + sessionFinal
      setTranscript(finalTranscriptRef.current)
      setInterimText(interim)
    }

    recognition.onerror = (event: SpeechRecognitionEventLike) => {
      if (event.error === 'no-speech') return
      isRecordingRef.current = false
      setState('error')
      setErrorMsg(`마이크 오류: ${event.error ?? '알 수 없음'}`)
    }

    recognition.onend = () => {
      // 의도치 않은 종료 시 재시작 (stopAndClassify에서는 ref를 먼저 null로 설정)
      if (recognitionRef.current && isRecordingRef.current) {
        // 현재 세션 확정 텍스트 저장
        committedRef.current = finalTranscriptRef.current
        // 300ms 대기 후 재시작 — Chrome이 즉시 재시작하면 버퍼 오디오를 재인식해 중복 발생
        setTimeout(() => {
          if (recognitionRef.current && isRecordingRef.current) {
            try {
              recognition.start()
            } catch {
              // 이미 시작된 경우 무시
            }
          }
        }, 300)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setState('recording')
  }

  async function stopAndClassify() {
    isRecordingRef.current = false
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.stop()

    const finalText = finalTranscriptRef.current.trim()
    if (!finalText) {
      setState('idle')
      return
    }

    setState('classifying')

    try {
      const res = await fetch('/api/ai-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalText,
          householdId,
          recordId,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'AI 분류 실패')

      setState('done')
      onClassified(json.data)
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'AI 분류 중 오류가 발생했습니다')
    }
  }

  function reset() {
    setState('idle')
    setTranscript('')
    setInterimText('')
    setErrorMsg('')
    finalTranscriptRef.current = ''
  }

  if (!isSupported) {
    return (
      <div
        className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800"
        style={{ wordBreak: 'keep-all' }}
      >
        이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {state !== 'recording' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={disabled || state === 'classifying'}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            음성으로 입력
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopAndClassify}
            className="gap-2"
          >
            <MicOff className="w-4 h-4" />
            <span className="animate-pulse">녹음 중지 후 AI 분류</span>
          </Button>
        )}

        {state === 'classifying' && (
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            AI가 내용을 분류하는 중...
          </span>
        )}

        {state === 'done' && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            분류 완료 — 아래 내용을 확인하세요
          </span>
        )}

        {(state === 'done' || state === 'error') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-slate-400 text-xs h-7"
          >
            다시 녹음
          </Button>
        )}
      </div>

      {/* 실시간 transcript */}
      {(state === 'recording' || transcript) && (
        <div
          className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm min-h-[60px] max-h-40 overflow-y-auto"
          style={{ wordBreak: 'keep-all' }}
        >
          {state === 'recording' && !transcript && !interimText && (
            <span className="text-slate-400">말씀하세요...</span>
          )}
          <span className="text-slate-800">{transcript}</span>
          <span className="text-slate-400">{interimText}</span>
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
