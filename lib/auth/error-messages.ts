/**
 * Los errores de autenticación que ve el usuario, en español y EN UN SOLO SITIO.
 *
 * Dos entradas, y no se mezclan:
 *
 * - `traducirErrorDeAuth(error)`: un error de Supabase recién recibido (de
 *   signInWithPassword, verifyOtp, resetPasswordForEmail…), con su `message` en
 *   inglés y su `code`.
 * - `mensajeDeErrorEnUrl(codigo, codigoDeSupabase)`: lo que llega en `?error=` y
 *   `?error_code=`. En la URL solo viajan CÓDIGOS, nunca texto: quien escribe la URL
 *   no es necesariamente la aplicación. Antes, `/login?error=<cualquier frase en
 *   español>` se mostraba tal cual, y eso permitía fabricar un aviso con aspecto
 *   oficial («llama a este número…») con un simple enlace. Un código desconocido da
 *   el mensaje genérico.
 *
 * Lo que no se reconoce nunca se muestra en inglés: cae en MENSAJE_GENERICO.
 */

/** Lo que se dice cuando no se reconoce el error. */
export const MENSAJE_GENERICO = 'Ha ocurrido un error. Inténtalo de nuevo.'

const ENLACE_CADUCADO = 'El enlace ha caducado o ya se usó. Pide uno nuevo.'
const ENLACE_DE_OTRO_NAVEGADOR =
  'El enlace ha caducado o se abrió en otro navegador. Pide uno nuevo.'
const DEMASIADOS_CORREOS = 'Se han enviado demasiados correos. Espera un rato e inténtalo de nuevo.'
const DEMASIADOS_INTENTOS = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
const CONTRASENA_LARGA = 'La contraseña es demasiado larga. Usa 72 caracteres o menos.'
const CONTRASENA_CORTA = 'La contraseña debe tener al menos 6 caracteres.'
const CREDENCIALES = 'Credenciales incorrectas. Revisa tu correo y tu contraseña.'

/**
 * Por el TEXTO de Supabase (en minúsculas, coincidencia parcial).
 *
 * El orden importa: se recorre en orden de inserción y gana la primera clave
 * contenida en el mensaje. Las de «demasiado larga» van antes que las de
 * «demasiado corta»: sin ellas, «Password cannot be longer than 72 characters»
 * caía en el genérico —o en el de los 6 caracteres si el código era
 * weak_password— y el usuario leía justo lo contrario de lo que pasaba. El límite
 * son 72 bytes porque es el de bcrypt, no una decisión de Nodo360.
 */
const POR_TEXTO: Array<[string, string]> = [
  // Registro
  ['user already registered', 'Este correo electrónico ya está registrado. ¿Quieres iniciar sesión?'],
  ['already registered', 'Este correo electrónico ya está registrado.'],
  ['email already exists', 'Este correo electrónico ya está en uso.'],

  // Contraseña
  ['password cannot be longer than', CONTRASENA_LARGA],
  ['password should be at most', CONTRASENA_LARGA],
  ['password is too long', CONTRASENA_LARGA],
  ['password should be at least', CONTRASENA_CORTA],
  ['weak password', 'La contraseña es muy débil. Usa al menos 6 caracteres.'],
  ['password is too short', CONTRASENA_CORTA],
  ['should be different from the old password', 'La contraseña nueva debe ser distinta de la actual.'],

  // Enlaces y códigos de un solo uso
  ['email link is invalid or has expired', ENLACE_CADUCADO],
  ['token has expired or is invalid', ENLACE_CADUCADO],
  ['code verifier', ENLACE_DE_OTRO_NAVEGADOR],
  ['invalid flow state', ENLACE_DE_OTRO_NAVEGADOR],

  // Correo
  ['invalid email', 'El correo electrónico no es válido.'],
  ['email not confirmed', 'Confirma tu correo electrónico antes de iniciar sesión.'],

  // Inicio de sesión
  ['invalid login credentials', CREDENCIALES],
  ['invalid credentials', CREDENCIALES],
  ['user not found', 'No existe una cuenta con este correo electrónico.'],

  // Límites
  ['email rate limit exceeded', DEMASIADOS_CORREOS],
  ['rate limit', DEMASIADOS_INTENTOS],
  ['too many requests', DEMASIADOS_INTENTOS],

  // Sesión
  ['refresh token not found', 'Tu sesión no es válida. Vuelve a iniciar sesión.'],
  ['invalid refresh token', 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],
  ['session expired', 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],

  // Proveedores
  ['provider is not enabled', 'Este método de inicio de sesión no está habilitado.'],
  ['provider not enabled', 'Este método de inicio de sesión no está habilitado.'],

  // Cuenta
  ['user is banned', 'Tu cuenta está bloqueada. Escribe a soporte si crees que es un error.'],
  ['user banned', 'Tu cuenta está bloqueada. Escribe a soporte si crees que es un error.'],

  // Red
  ['failed to fetch', 'Error de conexión. Revisa tu conexión a internet e inténtalo de nuevo.'],
  ['network error', 'Error de conexión. Revisa tu conexión a internet e inténtalo de nuevo.'],
]

/**
 * Por el CÓDIGO de Supabase (`error.code` de un AuthApiError, o `error_code` en la
 * URL de vuelta). Va DESPUÉS del texto porque es menos preciso: weak_password vale
 * tanto para una contraseña corta como para una demasiado larga.
 */
const POR_CODIGO: Record<string, string> = {
  otp_expired: ENLACE_CADUCADO,
  // El flujo PKCE de los correos enviados antes de /auth/confirmar: el código solo
  // se canjea en el navegador que pidió el correo
  flow_state_not_found: ENLACE_DE_OTRO_NAVEGADOR,
  flow_state_expired: ENLACE_DE_OTRO_NAVEGADOR,
  bad_code_verifier: ENLACE_DE_OTRO_NAVEGADOR,
  invalid_credentials: CREDENCIALES,
  email_not_confirmed: 'Confirma tu correo electrónico antes de iniciar sesión.',
  user_already_exists: 'Este correo electrónico ya está registrado.',
  email_exists: 'Este correo electrónico ya está registrado.',
  email_address_invalid: 'El correo electrónico no es válido.',
  weak_password: CONTRASENA_CORTA,
  same_password: 'La contraseña nueva debe ser distinta de la actual.',
  over_email_send_rate_limit: DEMASIADOS_CORREOS,
  over_request_rate_limit: DEMASIADOS_INTENTOS,
  user_banned: 'Tu cuenta está bloqueada. Escribe a soporte si crees que es un error.',
  user_not_found: 'No existe una cuenta con este correo electrónico.',
  signup_disabled: 'El registro está cerrado en este momento.',
  provider_disabled: 'Este método de inicio de sesión no está habilitado.',
  email_provider_disabled: 'El inicio de sesión por correo no está habilitado.',
  session_expired: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  session_not_found: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  refresh_token_not_found: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
}

/**
 * Códigos PROPIOS de Nodo360: los que la aplicación pone en `?error=` cuando el
 * error no viene de Supabase o no trae código.
 */
const PROPIOS: Record<string, string> = {
  // Lo que Supabase devuelve cuando se cancela el permiso en Google. Un enlace
  // caducado llega TAMBIÉN como access_denied, pero con error_code=otp_expired, y
  // ese se mira antes (ver mensajeDeErrorEnUrl).
  access_denied: 'No se completó el inicio de sesión: se canceló o no se concedió el permiso.',
  enlace_invalido: 'El enlace no es válido. Pide uno nuevo.',
  callback_error: 'No se pudo procesar el enlace. Inténtalo de nuevo.',
  credenciales_incompletas: 'Escribe tu correo y tu contraseña.',
  oauth_error: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  logout_error: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
  sin_perfil_rls: 'No se pudo cargar tu perfil. Inténtalo de nuevo y, si se repite, escribe a soporte.',
  suspended: 'Tu cuenta ha sido suspendida. Escribe a soporte para más información.',
  error_inesperado: MENSAJE_GENERICO,
}

/** «For security purposes, you can only request this after 37 seconds.» */
const ESPERA_EN_SEGUNDOS = /only request this after (\d+) seconds?/i

export type ErrorDeAuth = { message?: string | null; code?: string | null } | null | undefined

/**
 * El mensaje en español para un error de Supabase. Orden: la espera en segundos
 * (lleva un número que hay que conservar), el texto, el código y, si nada encaja,
 * el genérico.
 */
export function traducirErrorDeAuth(error: ErrorDeAuth): string {
  const texto = error?.message ?? ''

  const espera = ESPERA_EN_SEGUNDOS.exec(texto)
  if (espera) {
    const n = Number(espera[1])
    return `Por seguridad, espera ${n} ${n === 1 ? 'segundo' : 'segundos'} antes de volver a pedirlo.`
  }

  const minusculas = texto.toLowerCase()
  for (const [clave, mensaje] of POR_TEXTO) {
    if (minusculas.includes(clave)) return mensaje
  }

  if (error?.code && POR_CODIGO[error.code]) return POR_CODIGO[error.code]

  return MENSAJE_GENERICO
}

/**
 * El código que se pone en `?error=` para un error de Supabase: el suyo si lo
 * conocemos, y si no uno propio. Nunca su texto.
 */
export function codigoParaLaUrl(error: ErrorDeAuth, porDefecto = 'error_inesperado'): string {
  return error?.code && POR_CODIGO[error.code] ? error.code : porDefecto
}

/**
 * El mensaje para lo que llega en la URL. `codigoDeSupabase` es el `error_code`
 * que Supabase añade a su vuelta (`error=access_denied&error_code=otp_expired`):
 * va primero porque es el que dice qué pasó de verdad.
 */
export function mensajeDeErrorEnUrl(
  codigo: string | null | undefined,
  codigoDeSupabase?: string | null
): string {
  if (codigoDeSupabase && POR_CODIGO[codigoDeSupabase]) return POR_CODIGO[codigoDeSupabase]
  if (!codigo) return MENSAJE_GENERICO
  return POR_CODIGO[codigo] ?? PROPIOS[codigo] ?? MENSAJE_GENERICO
}
