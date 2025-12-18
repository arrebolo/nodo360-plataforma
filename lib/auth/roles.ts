// lib/auth/roles.ts
// Sistema simplificado de roles usando users.role como fuente de verdad

export type PlatformRole = 'student' | 'instructor' | 'mentor' | 'admin'

export interface RoleInfo {
  value: PlatformRole
  label: string
  description: string
  color: string
  level: number
}

export const PLATFORM_ROLES: RoleInfo[] = [
  {
    value: 'student',
    label: 'Estudiante',
    description: 'Usuario estándar de la plataforma',
    color: 'bg-gray-500',
    level: 1
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Puede crear y gestionar cursos',
    color: 'bg-blue-500',
    level: 2
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Guía estudiantes, privilegios especiales',
    color: 'bg-purple-500',
    level: 3
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Control total del sistema',
    color: 'bg-red-500',
    level: 4
  },
]

/**
 * Obtiene información de un rol
 */
export function getRoleInfo(role: PlatformRole): RoleInfo | undefined {
  return PLATFORM_ROLES.find(r => r.value === role)
}

/**
 * Obtiene el nivel numérico de un rol
 */
export function getRoleLevel(role: PlatformRole): number {
  return getRoleInfo(role)?.level ?? 0
}

/**
 * Verifica si un rol es válido
 */
export function isValidRole(role: string): role is PlatformRole {
  return ['student', 'instructor', 'mentor', 'admin'].includes(role)
}

/**
 * Verifica si el rol A tiene nivel mayor o igual que el rol B
 */
export function hasRoleLevel(userRole: PlatformRole, requiredRole: PlatformRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(role: PlatformRole): boolean {
  return role === 'admin'
}

/**
 * Verifica si el usuario es mentor o superior
 */
export function isMentorOrAbove(role: PlatformRole): boolean {
  return hasRoleLevel(role, 'mentor')
}

/**
 * Verifica si el usuario es instructor o superior
 */
export function isInstructorOrAbove(role: PlatformRole): boolean {
  return hasRoleLevel(role, 'instructor')
}

/**
 * Obtiene el label del rol en español
 */
export function getRoleLabel(role: PlatformRole): string {
  return getRoleInfo(role)?.label ?? 'Desconocido'
}

/**
 * Obtiene el color CSS del rol
 */
export function getRoleColor(role: PlatformRole): string {
  return getRoleInfo(role)?.color ?? 'bg-gray-500'
}
