import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * Cliente Supabase con SERVICE ROLE para operaciones administrativas.
 * Usar SOLO en app/api/admin/** (Route Handlers).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY')

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  })
}
