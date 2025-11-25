import { createClient } from '@/lib/supabase/server'
import { UserRole, getHighestRole } from '@/types/roles'

interface GetUserRolesResult {
  roles: UserRole[]
  highestRole: UserRole
  isAdmin: boolean
  isMentor: boolean
  isCouncil: boolean
}

export async function getUserRoles(userId?: string): Promise<GetUserRolesResult> {
  const supabase = await createClient()

  // Si no se proporciona userId, obtener el usuario actual
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        roles: ['user'],
        highestRole: 'user',
        isAdmin: false,
        isMentor: false,
        isCouncil: false,
      }
    }
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', targetUserId)
    .eq('is_active', true)

  if (error) {
    console.error('❌ [getUserRoles] Error:', error)
    return {
      roles: ['user'],
      highestRole: 'user',
      isAdmin: false,
      isMentor: false,
      isCouncil: false,
    }
  }

  const roles: UserRole[] = data && data.length > 0
    ? data.map(r => r.role as UserRole)
    : ['user']

  const highestRole = getHighestRole(roles)

  return {
    roles,
    highestRole,
    isAdmin: roles.includes('admin') || roles.includes('council'),
    isMentor: roles.includes('mentor'),
    isCouncil: roles.includes('council'),
  }
}
