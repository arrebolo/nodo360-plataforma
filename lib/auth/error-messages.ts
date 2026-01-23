/**
 * Mensajes de error de autenticación en español
 * Mapea errores de Supabase Auth a mensajes amigables
 */

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Errores de registro
  'user already registered': 'Este correo electrónico ya está registrado. ¿Quieres iniciar sesión?',
  'already registered': 'Este correo electrónico ya está registrado.',
  'email already exists': 'Este correo electrónico ya está en uso.',
  'user_already_exists': 'Este correo electrónico ya está registrado.',

  // Errores de contraseña
  'password should be at least': 'La contraseña debe tener al menos 6 caracteres.',
  'weak password': 'La contraseña es muy débil. Usa al menos 6 caracteres.',
  'password is too short': 'La contraseña debe tener al menos 6 caracteres.',

  // Errores de email
  'invalid email': 'El correo electrónico no es válido.',
  'email not confirmed': 'Por favor confirma tu correo electrónico antes de iniciar sesión.',
  'email link is invalid': 'El enlace mágico es inválido o ha expirado.',

  // Errores de login
  'invalid login credentials': 'Credenciales incorrectas. Verifica tu email y contraseña.',
  'invalid credentials': 'Credenciales incorrectas.',
  'wrong password': 'Contraseña incorrecta.',
  'user not found': 'No existe una cuenta con este correo electrónico.',

  // Rate limiting
  'email rate limit exceeded': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  'rate limit': 'Demasiadas solicitudes. Espera un momento.',
  'too many requests': 'Demasiados intentos. Por favor espera unos minutos.',

  // Errores de sesión
  'session expired': 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
  'refresh token not found': 'Sesión no válida. Por favor inicia sesión de nuevo.',
  'invalid refresh token': 'Sesión expirada. Por favor inicia sesión de nuevo.',

  // Errores de OAuth
  'oauth error': 'Error al iniciar sesión con este proveedor.',
  'provider not enabled': 'Este método de inicio de sesión no está habilitado.',

  // Errores de código de invitación
  'invite required': 'Se requiere un código de invitación para registrarse.',
  'invalid invite': 'El código de invitación no es válido.',
  'invite expired': 'El código de invitación ha expirado.',
  'invite used': 'El código de invitación ya ha sido utilizado.',

  // Errores generales
  'network error': 'Error de conexión. Verifica tu internet e intenta de nuevo.',
  'unexpected error': 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.',
}

/**
 * Convierte un mensaje de error a español
 * Busca coincidencias parciales (case-insensitive)
 */
export function getSpanishErrorMessage(error: string | null | undefined): string {
  if (!error) return 'Ha ocurrido un error. Por favor intenta de nuevo.'

  const errorLower = error.toLowerCase()

  // Buscar coincidencia parcial
  for (const [key, message] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (errorLower.includes(key.toLowerCase())) {
      return message
    }
  }

  // Si el error ya está en español (contiene caracteres especiales), devolverlo
  if (/[áéíóúñ¿¡]/i.test(error)) {
    return error
  }

  // Default
  return 'Ha ocurrido un error. Por favor intenta de nuevo.'
}

/**
 * Códigos de error específicos de Supabase
 */
export const SUPABASE_ERROR_CODES: Record<string, string> = {
  'user_already_exists': 'Este correo electrónico ya está registrado.',
  'weak_password': 'La contraseña debe tener al menos 6 caracteres.',
  'invalid_credentials': 'Credenciales incorrectas.',
  'email_not_confirmed': 'Por favor confirma tu correo electrónico.',
  'otp_expired': 'El código de verificación ha expirado.',
  'same_password': 'La nueva contraseña debe ser diferente a la actual.',
  'over_email_send_rate_limit': 'Demasiados emails enviados. Espera unos minutos.',
}

/**
 * Obtiene mensaje por código de error de Supabase
 */
export function getMessageByCode(code: string | null | undefined): string | null {
  if (!code) return null
  return SUPABASE_ERROR_CODES[code] ?? null
}
