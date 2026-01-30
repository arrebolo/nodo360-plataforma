/**
 * Mensajes de error centralizados en español
 * Mapea errores comunes de Supabase, Auth, Storage y generales
 */

export const errorMessages: Record<string, string> = {
  // =====================================================
  // Auth Errors
  // =====================================================
  'invalid login credentials': 'Email o contrasena incorrectos',
  'invalid credentials': 'Credenciales incorrectas',
  'email not confirmed': 'Por favor confirma tu email antes de iniciar sesion',
  'user already registered': 'Este email ya esta registrado',
  'user_already_exists': 'Este email ya esta registrado',
  'password should be at least': 'La contrasena debe tener al menos 6 caracteres',
  'weak password': 'La contrasena es muy debil. Usa al menos 6 caracteres',
  'password is too short': 'La contrasena debe tener al menos 6 caracteres',
  'invalid email': 'El formato del email no es valido',
  'email rate limit exceeded': 'Demasiados intentos. Espera unos minutos',
  'rate limit': 'Demasiadas solicitudes. Espera un momento',
  'too many requests': 'Demasiados intentos. Por favor espera unos minutos',
  'session expired': 'Tu sesion ha expirado. Por favor inicia sesion de nuevo',
  'refresh token not found': 'Sesion no valida. Por favor inicia sesion de nuevo',
  'invalid refresh token': 'Sesion expirada. Por favor inicia sesion de nuevo',
  'access_denied': 'Acceso denegado. No tienes permisos para esta accion',
  'suspended': 'Tu cuenta ha sido suspendida. Contacta a soporte',
  'user banned': 'Tu cuenta ha sido bloqueada',

  // =====================================================
  // JWT/Session Errors
  // =====================================================
  'jwt expired': 'Tu sesion ha expirado. Por favor inicia sesion de nuevo',
  'jwt malformed': 'Error de sesion. Por favor inicia sesion de nuevo',
  'invalid token': 'Token invalido. Por favor inicia sesion de nuevo',
  'token expired': 'Tu sesion ha expirado',

  // =====================================================
  // Permission Errors
  // =====================================================
  'permission denied': 'No tienes permisos para realizar esta accion',
  'insufficient_privilege': 'Permisos insuficientes para esta operacion',
  'row level security': 'No tienes permisos para acceder a este recurso',
  'policy violation': 'Esta accion no esta permitida',

  // =====================================================
  // Database Errors
  // =====================================================
  'duplicate key': 'Este registro ya existe',
  'unique_violation': 'Ya existe un registro con estos datos',
  'foreign_key_violation': 'No se puede eliminar porque hay datos relacionados',
  'not_null_violation': 'Faltan campos obligatorios',
  'check_violation': 'Los datos no cumplen las validaciones requeridas',
  'invalid input syntax': 'Formato de datos invalido',

  // =====================================================
  // Storage Errors
  // =====================================================
  'bucket not found': 'Error de configuracion de almacenamiento. Contacta a soporte',
  'the resource already exists': 'Este archivo ya existe',
  'payload too large': 'El archivo es demasiado grande',
  'invalid mime type': 'Tipo de archivo no permitido',
  'storage quota exceeded': 'Se ha alcanzado el limite de almacenamiento',

  // =====================================================
  // Network Errors
  // =====================================================
  'network error': 'Error de conexion. Verifica tu internet',
  'failed to fetch': 'No se pudo conectar con el servidor',
  'network request failed': 'Error de red. Verifica tu conexion',
  'timeout': 'La solicitud tardo demasiado. Intenta de nuevo',
  'aborted': 'La solicitud fue cancelada',

  // =====================================================
  // PKCE/OAuth Errors
  // =====================================================
  'code verifier': 'El enlace ha expirado o fue abierto en otro navegador. Solicita uno nuevo',
  'pkce': 'El enlace ha expirado o fue abierto en otro navegador',
  'invalid flow state': 'El enlace ha expirado. Solicita uno nuevo',
  'oauth error': 'Error al iniciar sesion con este proveedor',

  // =====================================================
  // Form/Validation Errors
  // =====================================================
  'required field': 'Este campo es obligatorio',
  'invalid format': 'Formato invalido',
  'too long': 'El texto es demasiado largo',
  'too short': 'El texto es demasiado corto',

  // =====================================================
  // Course/Content Errors
  // =====================================================
  'course not found': 'Curso no encontrado',
  'lesson not found': 'Leccion no encontrada',
  'module not found': 'Modulo no encontrado',
  'already enrolled': 'Ya estas inscrito en este curso',
  'not enrolled': 'No estas inscrito en este curso',
  'course locked': 'Este curso no esta disponible',
  'premium required': 'Se requiere suscripcion Premium',
}

/**
 * Traduce un mensaje de error al español
 * Busca coincidencias parciales (case-insensitive)
 *
 * @param error - Mensaje de error en ingles o cualquier idioma
 * @returns Mensaje traducido al español o el original si no hay traduccion
 */
export function translateError(error: string | null | undefined): string {
  if (!error) return 'Ha ocurrido un error. Por favor intenta de nuevo.'

  const errorLower = error.toLowerCase()

  // Buscar coincidencia parcial
  for (const [key, message] of Object.entries(errorMessages)) {
    if (errorLower.includes(key.toLowerCase())) {
      return message
    }
  }

  // Si el error ya esta en espanol (contiene caracteres especiales), devolverlo
  if (/[áéíóúñ¿¡]/i.test(error)) {
    return error
  }

  // Default
  return 'Ha ocurrido un error. Por favor intenta de nuevo.'
}

/**
 * Traduce un error y lo formatea para mostrar en UI
 * Incluye el error original en modo desarrollo
 *
 * @param error - Error object o string
 * @returns Mensaje formateado para UI
 */
export function formatErrorForUI(error: unknown): string {
  if (error instanceof Error) {
    return translateError(error.message)
  }
  if (typeof error === 'string') {
    return translateError(error)
  }
  return 'Ha ocurrido un error inesperado.'
}

/**
 * Extrae el mensaje de error de diferentes tipos de respuestas
 *
 * @param response - Respuesta de API o error
 * @returns Mensaje de error extraido
 */
export function extractErrorMessage(response: unknown): string {
  if (!response) return 'Error desconocido'

  // Si es un objeto con mensaje
  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>

    // Supabase error format
    if (typeof obj.message === 'string') {
      return translateError(obj.message)
    }

    // API error format
    if (typeof obj.error === 'string') {
      return translateError(obj.error)
    }

    // Nested error
    if (obj.error && typeof obj.error === 'object') {
      const nested = obj.error as Record<string, unknown>
      if (typeof nested.message === 'string') {
        return translateError(nested.message)
      }
    }
  }

  // Si es string directamente
  if (typeof response === 'string') {
    return translateError(response)
  }

  return 'Error desconocido'
}
