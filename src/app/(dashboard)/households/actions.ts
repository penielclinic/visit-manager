'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireSeniorPastor } from '@/lib/auth'
import type { Database } from '@/types/database.types'
import type {
  HouseholdFormValues,
  MemberFormValues,
  ActionResult,
} from '@/types/households'

// ── 가구 ──────────────────────────────────────────────────────────

export async function createHouseholdAction(
  values: HouseholdFormValues
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '인증이 필요합니다' }

  const { data, error } = await supabase
    .from('households')
    .insert({
      cell_id: values.cell_id,
      household_name: values.household_name,
      representative_name: values.representative_name,
      address_full: values.address_full || null,
      address_detail: values.address_detail || null,
      phone_primary: values.phone_primary || null,
      phone_secondary: values.phone_secondary || null,
      status: values.status,
      notes: values.notes || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/households')
  return { success: true, data: { id: data.id } }
}

export async function updateHouseholdAction(
  id: string,
  values: HouseholdFormValues
): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('households')
    .update({
      cell_id: values.cell_id,
      household_name: values.household_name,
      representative_name: values.representative_name,
      address_full: values.address_full || null,
      address_detail: values.address_detail || null,
      phone_primary: values.phone_primary || null,
      phone_secondary: values.phone_secondary || null,
      status: values.status,
      notes: values.notes || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/households')
  revalidatePath(`/households/${id}`)
  return { success: true, data: undefined }
}

export async function deleteHouseholdAction(id: string): Promise<ActionResult> {
  const err = await requireSeniorPastor()
  if (err) return { success: false, error: err }

  // admin 클라이언트로 소프트 삭제 (RLS update WITH CHECK 우회)
  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error } = await admin
    .from('households')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/households')
  redirect('/households')
}

// ── 구성원 ─────────────────────────────────────────────────────────

export async function createMemberAction(
  householdId: string,
  values: MemberFormValues
): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('household_members')
    .insert({
      household_id: householdId,
      full_name: values.full_name,
      relation: values.relation,
      gender: values.gender,
      birth_year: values.birth_year ? parseInt(values.birth_year) : null,
      phone: values.phone || null,
      faith_status: values.faith_status,
      is_primary: values.is_primary,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath(`/households/${householdId}`)
  return { success: true, data: { id: data.id } }
}

export async function updateMemberAction(
  memberId: string,
  householdId: string,
  values: MemberFormValues
): Promise<ActionResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('household_members')
    .update({
      full_name: values.full_name,
      relation: values.relation,
      gender: values.gender,
      birth_year: values.birth_year ? parseInt(values.birth_year) : null,
      phone: values.phone || null,
      faith_status: values.faith_status,
      is_primary: values.is_primary,
    })
    .eq('id', memberId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/households/${householdId}`)
  return { success: true, data: undefined }
}

export async function deleteMemberAction(
  memberId: string,
  householdId: string
): Promise<ActionResult> {
  const err = await requireSeniorPastor()
  if (err) return { success: false, error: err }

  const supabase = createClient()
  const { error } = await supabase
    .from('household_members')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', memberId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/households/${householdId}`)
  return { success: true, data: undefined }
}

// ── 구역 / 순 ─────────────────────────────────────────────────────

export async function createDistrictAction(
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('districts')
    .insert({ name: name.trim() })
    .select('id, name')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createCellAction(
  districtId: string,
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cells')
    .insert({ district_id: districtId, name: name.trim() })
    .select('id, name')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}
