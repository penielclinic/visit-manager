export interface AiClassifyResult {
  content: string
  prayer_notes: string
  special_notes: string
  ai_summary: string
  ai_follow_up: string
}

export interface AiClassifyRequest {
  transcript: string
  householdId: string
  recordId: string
}

export interface AiClassifyResponse {
  success: boolean
  data?: AiClassifyResult
  voiceRecordingId?: string
  error?: string
}
