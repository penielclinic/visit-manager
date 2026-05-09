'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import {
  createRecordAction,
  updateRecordAction,
  updateAiFieldsAction,
  type RecordFormValues,
} from '@/app/(dashboard)/records/actions'
import { VoiceRecorder } from './voice-recorder'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { VisitRecord } from '@/types/records'
import type { AiClassifyResult } from '@/types/voice'
import type { Enums } from '@/types/database.types'

interface HouseholdOption {
  id: string
  household_name: string
  representative_name: string
}

interface RecordFormProps {
  record?: VisitRecord
  households: HouseholdOption[]
  defaultHouseholdId?: string
  defaultScheduleId?: string
}

export function RecordForm({
  record,
  households,
  defaultHouseholdId,
  defaultScheduleId,
}: RecordFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const isEdit = !!record

  const [householdId, setHouseholdId] = useState(
    record?.household_id ?? defaultHouseholdId ?? ''
  )
  const [visitType, setVisitType] = useState<Enums<'visit_type'>>(
    record?.visit_type ?? 'regular'
  )
  const [visitedAt, setVisitedAt] = useState(
    record?.visited_at?.slice(0, 10) ??
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
  )
  const [content, setContent] = useState(record?.content ?? '')
  const [prayerNotes, setPrayerNotes] = useState(record?.prayer_notes ?? '')
  const [specialNotes, setSpecialNotes] = useState(record?.special_notes ?? '')
  const [duration, setDuration] = useState(
    record?.duration_actual_min?.toString() ?? ''
  )

  // 음성 녹음용 draft record ID 관리
  const [draftRecordId, setDraftRecordId] = useState<string | null>(
    record?.id ?? null
  )
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)

  // 녹음 시작 전 draft record 생성 (voice_recordings FK 요구)
  async function ensureDraftRecord(): Promise<string | null> {
    if (draftRecordId) return draftRecordId
    if (!householdId) return null

    setIsCreatingDraft(true)
    const result = await createRecordAction({
      household_id: householdId,
      schedule_id: defaultScheduleId ?? null,
      visit_type: visitType,
      visited_at: visitedAt,
      content: null,
      special_notes: null,
      duration_actual_min: null,
    })
    setIsCreatingDraft(false)

    if (result.success) {
      setDraftRecordId(result.data.id)
      return result.data.id
    }
    return null
  }

  // AI 분류 결과를 폼 필드에 자동 채우기
  async function handleClassified(result: AiClassifyResult) {
    setContent(result.content)
    setPrayerNotes(result.prayer_notes)
    setSpecialNotes(result.special_notes)

    // ai_summary, ai_follow_up은 DB에 직접 저장
    if (draftRecordId && (result.ai_summary || result.ai_follow_up)) {
      await updateAiFieldsAction(draftRecordId, result.ai_summary, result.ai_follow_up)
    }
  }

  // 음성 버튼 클릭 → draft 생성 후 VoiceRecorder 활성화
  const [voiceRecordId, setVoiceRecordId] = useState<string | null>(
    record?.id ?? null
  )
  const [isPreparingVoice, setIsPreparingVoice] = useState(false)

  async function handleVoiceStart() {
    if (voiceRecordId) return // 이미 준비됨
    if (!householdId) {
      setError('음성 입력 전에 가구를 먼저 선택해주세요')
      return
    }
    setError('')
    setIsPreparingVoice(true)
    const id = await ensureDraftRecord()
    setIsPreparingVoice(false)
    if (id) setVoiceRecordId(id)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId) {
      setError('가구를 선택해주세요')
      return
    }
    setError('')

    const values: RecordFormValues = {
      household_id: householdId,
      schedule_id: record?.schedule_id ?? defaultScheduleId ?? null,
      visit_type: visitType,
      visited_at: visitedAt,
      content: content || null,
      prayer_notes: prayerNotes || null,
      special_notes: specialNotes || null,
      duration_actual_min: duration ? parseInt(duration) : null,
    }

    const targetId = draftRecordId

    startTransition(async () => {
      // draft가 이미 생성된 경우 update, 아니면 create
      const result =
        isEdit || targetId
          ? await updateRecordAction(targetId ?? record!.id, values)
          : await createRecordAction(values)

      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/records/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 가구 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="household">가구 *</Label>
        <Select
          value={householdId}
          onValueChange={(v) => {
            setHouseholdId(v)
            // 가구 변경 시 voice record ID 초기화 (새 draft 필요)
            if (!isEdit) {
              setDraftRecordId(null)
              setVoiceRecordId(null)
            }
          }}
          disabled={isEdit}
        >
          <SelectTrigger id="household">
            <SelectValue placeholder="가구를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {households.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                <span className="whitespace-nowrap">
                  {h.household_name} ({h.representative_name})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 심방 유형 + 날짜 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="visit-type">심방 유형 *</Label>
          <Select
            value={visitType}
            onValueChange={(v) => setVisitType(v as Enums<'visit_type'>)}
          >
            <SelectTrigger id="visit-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VISIT_TYPE_LABELS).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="visited-at">심방일 *</Label>
          <Input
            id="visited-at"
            type="date"
            value={visitedAt}
            onChange={(e) => setVisitedAt(e.target.value)}
            required
          />
        </div>
      </div>

      {/* 소요 시간 */}
      <div className="space-y-1.5">
        <Label htmlFor="duration">소요 시간 (분)</Label>
        <Input
          id="duration"
          type="number"
          min={1}
          max={300}
          placeholder="예: 60"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-36"
        />
      </div>

      {/* 음성 입력 섹션 */}
      <div className="space-y-1.5 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <Label className="text-sm font-medium text-slate-700">
          AI 음성 입력
          <span className="ml-1.5 text-xs font-normal text-slate-400">
            (선택 · Chrome/Edge 권장)
          </span>
        </Label>

        {voiceRecordId ? (
          <VoiceRecorder
            householdId={householdId}
            recordId={voiceRecordId}
            onClassified={handleClassified}
            disabled={pending}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleVoiceStart}
            disabled={!householdId || isPreparingVoice || pending}
            className="gap-2 text-slate-600"
          >
            {isPreparingVoice ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>🎙️</span>
            )}
            {isPreparingVoice ? '준비 중...' : '음성으로 입력'}
          </Button>
        )}

        {!householdId && (
          <p className="text-xs text-slate-400" style={{ wordBreak: 'keep-all' }}>
            가구를 먼저 선택하면 음성 입력이 활성화됩니다
          </p>
        )}
      </div>

      {/* 내용 */}
      <div className="space-y-1.5">
        <Label htmlFor="content">심방 내용</Label>
        <Textarea
          id="content"
          placeholder="심방 내용을 입력하거나 음성으로 자동 채우세요"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ wordBreak: 'keep-all' }}
        />
      </div>

      {/* 특이사항 */}
      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-700">특이사항</p>

        <div className="space-y-1.5">
          <Label htmlFor="prayer-notes">기도제목</Label>
          <Textarea
            id="prayer-notes"
            placeholder="가구원의 기도제목을 입력하세요"
            rows={3}
            value={prayerNotes}
            onChange={(e) => setPrayerNotes(e.target.value)}
            style={{ wordBreak: 'keep-all' }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="special-notes">기타 특이사항</Label>
          <Textarea
            id="special-notes"
            placeholder="건강, 가정사 등 특별히 주의가 필요한 사항"
            rows={3}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            style={{ wordBreak: 'keep-all' }}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending || isCreatingDraft}>
          {pending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEdit ? '수정 저장' : '기록 저장'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
