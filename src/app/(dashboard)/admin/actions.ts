'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types/households'
import type { Enums } from '@/types/database.types'

async function assertSeniorPastor() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'senior_pastor'
}

export async function updateUserRoleAction(
  userId: string,
  role: Enums<'user_role'>
): Promise<ActionResult<void>> {
  if (!(await assertSeniorPastor())) {
    return { success: false, error: '권한이 없습니다' }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin')
  return { success: true, data: undefined }
}

export async function toggleUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult<void>> {
  if (!(await assertSeniorPastor())) {
    return { success: false, error: '권한이 없습니다' }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin')
  return { success: true, data: undefined }
}
