/**
 * Secure Logger
 * - Sanitizes sensitive data (emails, passwords, tokens)
 * - Only logs debug info in development
 * - Always logs warnings and errors
 */

const isDev = process.env.NODE_ENV === 'development'

// Campos que nunca deben aparecer en logs
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'authorization',
  'cookie', 'session', 'credit_card', 'ssn', 'api_key',
  'access_token', 'refresh_token', 'private_key'
]

// Sanitizar objeto removiendo campos sensibles
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(sanitize)
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()

    // Ocultar campos sensibles completamente
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    // Truncar emails (mostrar solo dominio)
    if (lowerKey.includes('email') && typeof value === 'string') {
      const [, domain] = value.split('@')
      sanitized[key] = domain ? `***@${domain}` : '[REDACTED]'
      continue
    }

    // Truncar IDs de usuario (mostrar solo primeros 8 chars)
    if ((lowerKey === 'user_id' || lowerKey === 'userid' || lowerKey === 'id') && typeof value === 'string' && value.length > 8) {
      sanitized[key] = value.substring(0, 8) + '...'
      continue
    }

    // Recursivamente sanitizar objetos anidados
    sanitized[key] = typeof value === 'object' ? sanitize(value) : value
  }

  return sanitized
}

// Formatear datos para log
function formatData(data: unknown): string {
  if (data === undefined) return ''
  const sanitized = sanitize(data)
  try {
    return JSON.stringify(sanitized, null, 0)
  } catch {
    return String(sanitized)
  }
}

export const logger = {
  log: (message: string, data?: unknown) => {
    if (isDev) {
      console.log(message, data ? formatData(data) : '')
    }
  },

  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data ? formatData(data) : '')
  },

  success: (message: string, data?: unknown) => {
    console.log(`[OK] ${message}`, data ? formatData(data) : '')
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data ? formatData(data) : '')
  },

  error: (message: string, error?: unknown) => {
    // Para errores, extraer mensaje sin stack trace en producción
    let errorInfo: unknown = error

    if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        name: error.name,
        // Solo incluir stack en desarrollo
        ...(isDev && { stack: error.stack })
      }
    }

    console.error(`[ERROR] ${message}`, errorInfo ? formatData(errorInfo) : '')
  },

  debug: (label: string, data?: unknown) => {
    if (isDev) {
      console.log(`[DEBUG ${label}]`, data ? formatData(data) : '')
    }
  },

  // Log de request sin datos sensibles
  request: (method: string, path: string, userId?: string) => {
    const userPart = userId ? ` | User: ${userId.substring(0, 8)}...` : ''
    console.log(`[${method}] ${path}${userPart}`)
  }
}
