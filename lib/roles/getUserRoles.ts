import { createClient } from '@/lib/supabase/server'
import { UserRole, getHighestRole } from '@/types/roles'

interface GetUserRolesResult {
  roles: UserRole[]
  highestRole: UserRole
  isAdmin: boolean
  isMentor: boolean
  isCouncil: boolean
}

// Mapeo de roles legacy (student, instructor) a nuevos roles
function mapLegacyRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'student': 'user',
    'instructor': 'admin',
    'admin': 'admin',
    'mentor': 'mentor',
    'council': 'council',
    'candidate_mentor': 'candidate_mentor',
    'user': 'user'
  }
  return roleMap[role] || 'user'
}

export async function getUserRoles(userId?: string): Promise<GetUserRolesResult> {
  const supabase = await createClient()

  const defaultResult: GetUserRolesResult = {
    roles: ['user'],
    highestRole: 'user',
    isAdmin: false,
    isMentor: false,
    isCouncil: false,
  }

  // Si no se proporciona userId, obtener el usuario actual
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return defaultResult
    }
    targetUserId = user.id
  }

  // Primero intentar con la tabla user_roles (sistema nuevo)
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', targetUserId)
    .eq('is_active', true)

  // Si la tabla user_roles existe y tiene datos, usar esos roles
  if (!rolesError && rolesData && rolesData.length > 0) {
    const roles: UserRole[] = rolesData.map(r => r.role as UserRole)
    const highestRole = getHighestRole(roles)

    return {
      roles,
      highestRole,
      isAdmin: roles.includes('admin') || roles.includes('council'),
      isMentor: roles.includes('mentor'),
      isCouncil: roles.includes('council'),
    }
  }

  // Fallback: usar el campo role de la tabla users (sistema legacy)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', targetUserId)
    .single()

  if (userError) {
    console.error('❌ [getUserRoles] Error obteniendo rol de usuario:', {
      message: userError.message,
      code: userError.code,
      details: userError.details,
      hint: userError.hint
    })
    return defaultResult
  }

  if (!userData) {
    console.warn('⚠️ [getUserRoles] Usuario no encontrado:', targetUserId)
    return defaultResult
  }

  const mappedRole = mapLegacyRole(userData.role || 'user')
  const roles: UserRole[] = [mappedRole]
  const highestRole = mappedRole

  return {
    roles,
    highestRole,
    isAdmin: mappedRole === 'admin' || mappedRole === 'council',
    isMentor: mappedRole === 'mentor',
    isCouncil: mappedRole === 'council',
  }
}
