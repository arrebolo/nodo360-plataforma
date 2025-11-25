// =============================================
// TIPOS DEL SISTEMA DE ROLES - NODO360
// =============================================

export type UserRole = 'user' | 'candidate_mentor' | 'mentor' | 'admin' | 'council'

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface UserWithRoles {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  roles: UserRole[]
  highest_role: UserRole
}

// Jerarquía de roles (mayor número = más permisos)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  candidate_mentor: 2,
  mentor: 3,
  admin: 4,
  council: 5,
}

// Información de cada rol
export const ROLE_INFO: Record<UserRole, {
  label: string
  description: string
  color: string
  bgColor: string
  icon: string
}> = {
  user: {
    label: 'Usuario',
    description: 'Usuario estándar de la plataforma',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    icon: '👤',
  },
  candidate_mentor: {
    label: 'Candidato a Mentor',
    description: 'Ha solicitado ser mentor, en revisión',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    icon: '⏳',
  },
  mentor: {
    label: 'Mentor',
    description: 'Mentor aprobado que puede guiar estudiantes',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: '🎓',
  },
  admin: {
    label: 'Administrador',
    description: 'Acceso completo al panel de administración',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: '⚙️',
  },
  council: {
    label: 'Consejo',
    description: 'Miembro del consejo de gobernanza',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    icon: '👑',
  },
}

// Helper para verificar si un rol tiene acceso
export function hasAccess(userRoles: UserRole[], requiredRole: UserRole): boolean {
  const requiredLevel = ROLE_HIERARCHY[requiredRole]
  return userRoles.some(role => ROLE_HIERARCHY[role] >= requiredLevel)
}

// Helper para obtener el rol más alto
export function getHighestRole(roles: UserRole[]): UserRole {
  if (!roles || roles.length === 0) return 'user'

  return roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest
  , 'user' as UserRole)
}
