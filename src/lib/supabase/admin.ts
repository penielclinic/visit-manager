import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// RLS 우회 — 서버 사이드 관리자 전용
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
