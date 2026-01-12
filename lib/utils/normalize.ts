/**
 * Utilidades de normalización de strings para evitar problemas de encoding
 */

/**
 * Normaliza un string a formato NFC (Canonical Decomposition, followed by Canonical Composition)
 * Esto evita problemas como "IntroducciÃ³n" vs "Introducción"
 */
export function normalizeString(str: string): string {
  if (!str) return str
  return str
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
}

/**
 * Normaliza un título de curso/módulo/lección
 */
export function normalizeTitle(title: string): string {
  if (!title) return title
  return normalizeString(title)
}

/**
 * Normaliza y sanitiza un slug
 * - Convierte a minúsculas
 * - Reemplaza espacios y caracteres especiales por guiones
 * - Elimina caracteres no válidos
 * - Elimina guiones duplicados
 */
export function normalizeSlug(slug: string): string {
  if (!slug) return slug
  return slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Guiones múltiples a uno
    .replace(/^-|-$/g, '') // Guiones al inicio/final
}

/**
 * Valida que un slug sea válido
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3) return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Normaliza una descripción (permite más caracteres)
 */
export function normalizeDescription(desc: string): string {
  if (!desc) return desc
  return normalizeString(desc)
}

/**
 * Genera un slug a partir de un título
 */
export function generateSlug(title: string): string {
  if (!title) return ''
  return normalizeSlug(title)
}
