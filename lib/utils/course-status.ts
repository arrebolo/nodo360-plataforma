// lib/utils/course-status.ts
// Sistema de estados de curso

// ============================================
// TIPOS
// ============================================

export type CourseStatus = 'draft' | 'coming_soon' | 'published' | 'archived'

export interface CourseStatusConfig {
  label: string
  badgeColor: string
  badgeBg: string
  description: string
}

// ============================================
// CONFIGURACIÓN DE ESTADOS
// ============================================

export const COURSE_STATUS_CONFIG: Record<CourseStatus, CourseStatusConfig> = {
  draft: {
    label: 'Borrador',
    badgeColor: 'text-gray-400',
    badgeBg: 'bg-gray-500/20',
    description: 'Este curso está en desarrollo y no es visible públicamente.',
  },
  coming_soon: {
    label: 'Próximamente',
    badgeColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/20',
    description: 'Este curso estará disponible pronto.',
  },
  published: {
    label: 'Publicado',
    badgeColor: 'text-green-400',
    badgeBg: 'bg-green-500/20',
    description: 'Este curso está disponible para inscripción.',
  },
  archived: {
    label: 'Archivado',
    badgeColor: 'text-red-400',
    badgeBg: 'bg-red-500/20',
    description: 'Este curso ya no está disponible.',
  },
}

// ============================================
// HELPERS
// ============================================

/**
 * Verifica si el estado es un CourseStatus válido
 */
export function isValidCourseStatus(status: string | null | undefined): status is CourseStatus {
  if (!status) return false
  return ['draft', 'coming_soon', 'published', 'archived'].includes(status)
}

/**
 * Obtiene el estado normalizado (default: published)
 */
export function normalizeCourseStatus(status: string | null | undefined): CourseStatus {
  if (isValidCourseStatus(status)) return status
  return 'published'
}

/**
 * Verifica si el curso está publicado
 */
export function isCoursePublished(status: string | null | undefined): boolean {
  return normalizeCourseStatus(status) === 'published'
}

/**
 * Verifica si el curso está próximo a publicarse
 */
export function isCourseComingSoon(status: string | null | undefined): boolean {
  return normalizeCourseStatus(status) === 'coming_soon'
}

/**
 * Verifica si el curso es borrador
 */
export function isCourseDraft(status: string | null | undefined): boolean {
  return normalizeCourseStatus(status) === 'draft'
}

/**
 * Verifica si el curso está archivado
 */
export function isCourseArchived(status: string | null | undefined): boolean {
  return normalizeCourseStatus(status) === 'archived'
}

/**
 * Verifica si el curso permite inscripciones
 */
export function canEnrollInCourse(status: string | null | undefined): boolean {
  return isCoursePublished(status)
}

/**
 * Verifica si el curso es visible públicamente
 * (draft solo visible para admins)
 */
export function isCoursePubliclyVisible(status: string | null | undefined): boolean {
  const normalized = normalizeCourseStatus(status)
  return normalized !== 'draft'
}

/**
 * Obtiene la configuración del estado
 */
export function getCourseStatusConfig(status: string | null | undefined): CourseStatusConfig {
  const normalized = normalizeCourseStatus(status)
  return COURSE_STATUS_CONFIG[normalized]
}

/**
 * Obtiene el label del estado
 */
export function getCourseStatusLabel(status: string | null | undefined): string {
  return getCourseStatusConfig(status).label
}

/**
 * Obtiene las clases CSS del badge
 */
export function getCourseStatusBadgeClasses(status: string | null | undefined): string {
  const config = getCourseStatusConfig(status)
  return `${config.badgeBg} ${config.badgeColor}`
}
