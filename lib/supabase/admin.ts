import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { env } from '@/lib/env'

/**
 * Cliente Supabase con SERVICE ROLE para operaciones administrativas.
 * Usar SOLO en server-side (app/api/**, Route Handlers).
 *
 * NUNCA exponer en cliente
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Alias para consistencia con el naming convention
export const createSupabaseAdmin = createAdminClient


