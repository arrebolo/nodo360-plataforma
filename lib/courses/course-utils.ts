/**
 * Course Utilities
 * Shared utilities for course form handling
 */

/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '')           // Remove leading/trailing hyphens
}

/**
 * Course level options
 */
export const COURSE_LEVELS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
] as const

/**
 * Course status options
 */
export const COURSE_STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Archivado' },
] as const

export type CourseLevel = typeof COURSE_LEVELS[number]['value']
export type CourseStatus = typeof COURSE_STATUSES[number]['value']

/**
 * Course form data interface
 */
export interface CourseFormData {
  title: string
  slug: string
  description: string
  long_description?: string | null
  level: CourseLevel
  status: CourseStatus
  is_free: boolean
  is_premium: boolean
  price?: number | null
  thumbnail_url?: string | null
  banner_url?: string | null
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validate course form data
 */
export function validateCourseData(data: Partial<CourseFormData>): ValidationResult {
  const errors: Record<string, string> = {}

  // Title validation
  if (!data.title?.trim()) {
    errors.title = 'El título es requerido'
  } else if (data.title.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres'
  } else if (data.title.length > 100) {
    errors.title = 'El título no puede exceder 100 caracteres'
  }

  // Slug validation
  if (!data.slug?.trim()) {
    errors.slug = 'El slug es requerido'
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.slug = 'El slug solo puede contener letras minúsculas, números y guiones'
  } else if (data.slug.length < 3) {
    errors.slug = 'El slug debe tener al menos 3 caracteres'
  }

  // Description validation
  if (!data.description?.trim()) {
    errors.description = 'La descripción corta es requerida'
  } else if (data.description.length > 160) {
    errors.description = 'La descripción corta no puede exceder 160 caracteres'
  }

  // Level validation
  if (!data.level) {
    errors.level = 'El nivel es requerido'
  } else if (!COURSE_LEVELS.some(l => l.value === data.level)) {
    errors.level = 'Nivel inválido'
  }

  // Status validation
  if (!data.status) {
    errors.status = 'El estado es requerido'
  } else if (!COURSE_STATUSES.some(s => s.value === data.status)) {
    errors.status = 'Estado inválido'
  }

  // Price validation
  if (!data.is_free && data.price != null && data.price < 0) {
    errors.price = 'El precio no puede ser negativo'
  }

  // URL validations
  if (data.thumbnail_url && !isValidUrl(data.thumbnail_url)) {
    errors.thumbnail_url = 'URL de thumbnail inválida'
  }

  if (data.banner_url && !isValidUrl(data.banner_url)) {
    errors.banner_url = 'URL de banner inválida'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

/**
 * Extract course data from FormData
 */
export function extractCourseFromFormData(formData: FormData): CourseFormData {
  return {
    title: (formData.get('title') as string) || '',
    slug: (formData.get('slug') as string) || '',
    description: (formData.get('description') as string) || '',
    long_description: (formData.get('long_description') as string) || null,
    level: (formData.get('level') as CourseLevel) || 'beginner',
    status: (formData.get('status') as CourseStatus) || 'draft',
    is_free: formData.get('is_free') === 'true',
    is_premium: formData.get('is_premium') === 'true',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    thumbnail_url: (formData.get('thumbnail_url') as string) || null,
    banner_url: (formData.get('banner_url') as string) || null,
  }
}
