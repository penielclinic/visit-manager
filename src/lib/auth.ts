'use server'

import { createClient } from '@/lib/supabase/server'

/** 현재 사용자가 담임목사인지 확인. 아니면 '권한이 없습니다' 에러 메시지 반환 */
export async function requireSeniorPastor(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return '인증이 필요합니다'
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (data?.role !== 'senior_pastor') return '담임목사만 삭제할 수 있습니다'
  return null
}
