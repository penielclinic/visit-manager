'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSeniorPastor } from '@/lib/auth'
import type { ActionResult } from '@/types/households'
import type { Enums } from '@/types/database.types'

export interface RecordFormValues {
  household_id: string
  schedule_id?: string | null
  visit_type: Enums<'visit_type'>
  visited_at: string
  content?: string | null
  prayer_notes?: string | null
  special_notes?: string | null
  duration_actual_min?: number | null
}

export async function createRecordAction(
  values: RecordFormValues
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { data, error } = await supabase
    .from('visit_records')
    .insert({
      household_id: values.household_id,
      schedule_id: values.schedule_id ?? null,
      visit_type: values.visit_type,
      visited_at: values.visited_at,
      content: values.content ?? null,
      prayer_notes: values.prayer_notes ?? null,
      special_notes: values.special_notes ?? null,
      duration_actual_min: values.duration_actual_min ?? null,
      visited_by: user.id,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/records')
  return { success: true, data }
}

export async function updateRecordAction(
  id: string,
  values: RecordFormValues
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { data, error } = await supabase
    .from('visit_records')
    .update({
      household_id: values.household_id,
      schedule_id: values.schedule_id ?? null,
      visit_type: values.visit_type,
      visited_at: values.visited_at,
      content: values.content ?? null,
      prayer_notes: values.prayer_notes ?? null,
      special_notes: values.special_notes ?? null,
      duration_actual_min: values.duration_actual_min ?? null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/records')
  revalidatePath(`/records/${id}`)
  return { success: true, data }
}

export async function finalizeRecordAction(
  id: string
): Promise<ActionResult<void>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { error } = await supabase
    .from('visit_records')
    .update({ status: 'final' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/records')
  revalidatePath(`/records/${id}`)
  return { success: true, data: undefined }
}

export async function deleteRecordAction(id: string): Promise<ActionResult<void>> {
  const err = await requireSeniorPastor()
  if (err) return { success: false, error: err }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { error } = await supabase
    .from('visit_records')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/records')
  redirect('/records')
}

// 테이블에서 바로 휴지통으로 이동 (redirect 없이)
export async function trashRecordAction(id: string): Promise<ActionResult<void>> {
  const err = await requireSeniorPastor()
  if (err) return { success: false, error: err }

  const supabase = createClient()

  const { error } = await supabase
    .from('visit_records')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/records')
  return { success: true, data: undefined }
}

export async function restoreRecordAction(
  id: string
): Promise<ActionResult<void>> {
  const err = await requireSeniorPastor()
  if (err) return { success: false, error: err }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { error } = await supabase
    .from('visit_records')
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/records')
  revalidatePath('/records/trash')
  return { success: true, data: undefined }
}

export async function permanentDeleteRecordAction(
  id: string
): Promise<ActionResult<void>> {
  const err = await requireSeniorPastor()
  if (err) return { success: false, error: err }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { error } = await supabase
    .from('visit_records')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/records/trash')
  return { success: true, data: undefined }
}

export async function updateAiFieldsAction(
  id: string,
  aiSummary: string,
  aiFollowUp: string
): Promise<ActionResult<void>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { error } = await supabase
    .from('visit_records')
    .update({
      ai_summary: aiSummary || null,
      ai_follow_up: aiFollowUp || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/records/${id}`)
  return { success: true, data: undefined }
}

// Mark linked schedule as completed when record is finalized
export async function completeScheduleAction(
  scheduleId: string
): Promise<ActionResult<void>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { error } = await supabase
    .from('visit_schedules')
    .update({ status: 'completed' })
    .eq('id', scheduleId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/schedule')
  return { success: true, data: undefined }
}
