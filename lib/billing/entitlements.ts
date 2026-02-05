import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Entitlements System — Server-side only
 *
 * Verifica y gestiona permisos de acceso a contenido premium.
 * Usa SERVICE_ROLE para bypass RLS en queries administrativas.
 */

export type EntitlementType = 'course_access' | 'full_platform' | 'learning_path_access'

interface EntitlementRow {
  id: string
  user_id: string
  type: EntitlementType
  target_id: string | null
  granted_by: string | null
  reason: string | null
  is_active: boolean
  starts_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// READ functions
// =====================================================

/**
 * Verifica si un usuario tiene acceso a un curso premium.
 * Retorna true si:
 * - Tiene entitlement 'course_access' activo para ese course_id
 * - Tiene entitlement 'full_platform' activo
 * - El entitlement no ha expirado
 */
export async function hasEntitlement(
  userId: string,
  courseId: string
): Promise<boolean> {
  const supabase = createAdminClient() as any

  const now = new Date().toISOString()

  // Check course_access OR full_platform
  const { data, error } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or(`and(type.eq.course_access,target_id.eq.${courseId}),type.eq.full_platform`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)

  if (error) {
    console.error('[entitlements] Error checking entitlement:', error.message)
    return false
  }

  return (data?.length ?? 0) > 0
}

/**
 * Obtiene todos los entitlements activos de un usuario.
 */
export async function getUserEntitlements(userId: string): Promise<EntitlementRow[]> {
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[entitlements] Error fetching user entitlements:', error.message)
    return []
  }

  return data || []
}

/**
 * Verifica si un usuario tiene acceso full_platform.
 */
export async function hasFullPlatformAccess(userId: string): Promise<boolean> {
  const supabase = createAdminClient() as any
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'full_platform')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)

  if (error) {
    console.error('[entitlements] Error checking full platform access:', error.message)
    return false
  }

  return (data?.length ?? 0) > 0
}

// =====================================================
// WRITE functions (admin-only)
// =====================================================

interface GrantEntitlementParams {
  userId: string
  type: EntitlementType
  targetId?: string | null
  grantedBy: string
  reason?: string | null
  expiresAt?: string | null
}

/**
 * Otorga un entitlement a un usuario.
 * Si ya existe uno activo del mismo tipo+target, lo reemplaza.
 */
export async function grantEntitlement(params: GrantEntitlementParams): Promise<{
  data: EntitlementRow | null
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { userId, type, targetId = null, grantedBy, reason = null, expiresAt = null } = params

  // Upsert: si ya existe, actualizar
  const { data, error } = await supabase
    .from('entitlements')
    .upsert(
      {
        user_id: userId,
        type,
        target_id: targetId,
        granted_by: grantedBy,
        reason,
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      {
        onConflict: 'user_id,type,target_id',
      }
    )
    .select('*')
    .single()

  if (error) {
    console.error('[entitlements] Error granting entitlement:', error.message)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Revoca un entitlement (soft-delete: is_active = false).
 */
export async function revokeEntitlement(entitlementId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from('entitlements')
    .update({ is_active: false })
    .eq('id', entitlementId)

  if (error) {
    console.error('[entitlements] Error revoking entitlement:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/**
 * Lista todos los entitlements (para admin panel).
 * Opcionalmente filtrar por userId.
 */
export async function listEntitlements(filters?: {
  userId?: string
  type?: EntitlementType
  activeOnly?: boolean
  page?: number
  pageSize?: number
}): Promise<{
  entitlements: (EntitlementRow & { user?: { full_name: string | null; email: string } })[]
  total: number
}> {
  const supabase = createAdminClient() as any
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('entitlements')
    .select('*, user:users!entitlements_user_id_fkey(full_name, email)', { count: 'exact' })

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.activeOnly !== false) {
    query = query.eq('is_active', true)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[entitlements] Error listing entitlements:', error.message)
    return { entitlements: [], total: 0 }
  }

  return { entitlements: data || [], total: count || 0 }
}
