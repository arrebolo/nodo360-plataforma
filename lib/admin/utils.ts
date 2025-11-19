/**
 * Utilidades para el panel de administración
 */

/**
 * Genera un slug único a partir de un título
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

/**
 * Valida una URL de YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url) return true // Opcional

  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]

  return patterns.some(pattern => pattern.test(url))
}

/**
 * Valida los datos del formulario de curso
 */
export function validateCourseData(data: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'El título debe tener al menos 5 caracteres'
  }

  if (!data.slug || data.slug.trim().length < 3) {
    errors.slug = 'El slug es requerido y debe tener al menos 3 caracteres'
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres'
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(data.level)) {
    errors.level = 'Nivel inválido'
  }

  if (!data.is_free && (!data.price || data.price < 0)) {
    errors.price = 'El precio debe ser mayor o igual a 0'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Valida los datos del formulario de módulo
 */
export function validateModuleData(data: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres'
  }

  if (!data.slug || data.slug.trim().length < 3) {
    errors.slug = 'El slug es requerido'
  }

  if (data.order_index === undefined || data.order_index < 0) {
    errors.order_index = 'El orden debe ser mayor o igual a 0'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Valida los datos del formulario de lección
 */
export function validateLessonData(data: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres'
  }

  if (!data.slug || data.slug.trim().length < 3) {
    errors.slug = 'El slug es requerido'
  }

  if (data.video_url && !isValidYouTubeUrl(data.video_url)) {
    errors.video_url = 'La URL de YouTube no es válida'
  }

  if (data.video_duration_minutes && data.video_duration_minutes < 0) {
    errors.video_duration_minutes = 'La duración debe ser mayor a 0'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Formatea una fecha para mostrar
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea duración en minutos a formato legible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
