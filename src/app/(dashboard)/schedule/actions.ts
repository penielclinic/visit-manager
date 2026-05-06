'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleFormValues } from '@/types/schedules'
import type { ActionResult } from '@/types/households'
import type { Enums } from '@/types/database.types'

export async function createScheduleAction(
  values: ScheduleFormValues
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { data, error } = await supabase
    .from('visit_schedules')
    .insert({
      household_id: values.household_id,
      scheduled_date: values.scheduled_date,
      scheduled_time: values.scheduled_time || null,
      visit_type: values.visit_type,
      status: values.status,
      assigned_to: values.assigned_to || null,
      memo: values.memo || null,
      visit_order: values.visit_order ? parseInt(values.visit_order) : null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/schedule')
  revalidatePath('/dashboard')
  return { success: true, data: { id: data.id } }
}

export async function updateScheduleAction(
  id: string,
  values: ScheduleFormValues
): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('visit_schedules')
    .update({
      household_id: values.household_id,
      scheduled_date: values.scheduled_date,
      scheduled_time: values.scheduled_time || null,
      visit_type: values.visit_type,
      status: values.status,
      assigned_to: values.assigned_to || null,
      memo: values.memo || null,
      visit_order: values.visit_order ? parseInt(values.visit_order) : null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/schedule')
  revalidatePath(`/schedule/${id}`)
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

export async function updateScheduleStatusAction(
  id: string,
  status: Enums<'visit_status'>
): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('visit_schedules')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/schedule')
  revalidatePath(`/schedule/${id}`)
  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

export async function deleteScheduleAction(id: string): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('visit_schedules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/schedule')
  revalidatePath('/dashboard')
  redirect('/schedule')
}
