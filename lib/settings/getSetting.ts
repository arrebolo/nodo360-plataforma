import { createAdminClient } from '@/lib/supabase/admin'

type SettingsKey = 'xp_rules' | 'level_rules'

/**
 * Lee un setting desde public.system_settings (key/value jsonb).
 * Usa service_role (createAdminClient) para evitar dependencias de RLS.
 */
export async function getSetting<T>(
  key: SettingsKey,
  fallback: T
): Promise<T> {
  const admin = createAdminClient()

  const { data, error } = await (admin as any)
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data?.value) return fallback

  return data.value as T
}


