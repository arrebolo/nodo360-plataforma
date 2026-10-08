/**
 * Lo que ve el usuario cuando falla la autenticación: siempre en español, y lo que
 * llega en la URL solo si es un código conocido.
 *
 *   npx tsx scripts/comprobar-errores-de-auth.mts
 *
 * Sin red ni base: llama a las funciones de lib/auth/error-messages.ts con los
 * errores tal como los devuelve Supabase (texto en inglés y `code`) y con lo que
 * llega en `?error=` y `?error_code=`.
 */
// El fichero de lib es CommonJS para tsx (el paquete no es type: module), y los
// nombres sueltos no siempre se ven desde un .mts: se importa el modulo entero
import * as errores from '../lib/auth/error-messages.ts'
const { MENSAJE_GENERICO, codigoParaLaUrl, mensajeDeErrorEnUrl, traducirErrorDeAuth } =
  ((errores as any).default ?? errores) as typeof errores

let fallos = 0
function di(bien: boolean, texto: string, visto: unknown) {
  if (!bien) fallos++
  console.log(`  ${bien ? 'BIEN' : '*** MAL'}  ${texto}${bien ? '' : `\n         visto: ${JSON.stringify(visto)}`}`)
}
const contiene = (visto: string, ...trozos: string[]) => trozos.every((t) => visto.toLowerCase().includes(t))
const ingles = (visto: string) => /\b(the|you|is|has|after|seconds|request|invalid|expired)\b/i.test(visto)

console.log('\n== Errores de Supabase')
const caso = (texto: string, error: { message?: string; code?: string }, ...trozos: string[]) => {
  const visto = traducirErrorDeAuth(error)
  di(contiene(visto, ...trozos) && !ingles(visto), `${texto} -> ${trozos.join(' + ')}`, visto)
}
caso('enlace caducado (vuelta de Supabase)', { code: 'otp_expired', message: 'Email link is invalid or has expired' }, 'caducado', 'ya se usó', 'pide uno nuevo')
caso('enlace caducado (verifyOtp)', { code: 'otp_expired', message: 'Token has expired or is invalid' }, 'caducado', 'pide uno nuevo')
caso('solo el código otp_expired', { code: 'otp_expired' }, 'caducado')
caso('espera de 37 segundos', { code: 'over_email_send_rate_limit', message: 'For security purposes, you can only request this after 37 seconds.' }, '37 segundos')
caso('espera de 1 segundo', { message: 'For security purposes, you can only request this after 1 second.' }, '1 segundo ')
caso('límite de correos del proyecto', { code: 'over_email_send_rate_limit', message: 'Email rate limit exceeded' }, 'demasiados correos')
caso('credenciales', { code: 'invalid_credentials', message: 'Invalid login credentials' }, 'credenciales incorrectas')
caso('contraseña demasiado larga, aunque el código sea weak_password', { code: 'weak_password', message: 'Password cannot be longer than 72 characters' }, '72')
caso('contraseña corta', { code: 'weak_password', message: 'Password should be at least 6 characters.' }, 'al menos 6')
caso('misma contraseña', { code: 'same_password', message: 'New password should be different from the old password.' }, 'distinta')
caso('PKCE de un correo viejo abierto en otro navegador', { code: 'flow_state_not_found', message: 'invalid flow state, no valid flow state found' }, 'otro navegador')

for (const [texto, error] of [
  ['texto desconocido en inglés', { message: 'Something unexpected happened on our side' }],
  ['código desconocido', { code: 'algo_nuevo', message: 'A brand new error' }],
  ['sin nada', {}],
] as const) {
  const visto = traducirErrorDeAuth(error)
  di(visto === MENSAJE_GENERICO, `${texto} -> el genérico en español`, visto)
}
di(traducirErrorDeAuth(null) === MENSAJE_GENERICO, 'null -> el genérico', traducirErrorDeAuth(null))

console.log('\n== Lo que llega en la URL')
const url = (texto: string, codigo: string | null, codigoDeSupabase: string | null, ...trozos: string[]) => {
  const visto = mensajeDeErrorEnUrl(codigo, codigoDeSupabase)
  di(contiene(visto, ...trozos) && !ingles(visto), `${texto} -> ${trozos.join(' + ')}`, visto)
}
url('access_denied con error_code=otp_expired: caducado, NO «acceso denegado»', 'access_denied', 'otp_expired', 'caducado', 'pide uno nuevo')
di(!contiene(mensajeDeErrorEnUrl('access_denied', 'otp_expired'), 'cancel'), '... y no habla de cancelar', mensajeDeErrorEnUrl('access_denied', 'otp_expired'))
url('otp_expired solo en error', 'otp_expired', null, 'caducado')
url('access_denied sin error_code (se canceló en Google)', 'access_denied', null, 'no se completó')
url('suspended', 'suspended', null, 'suspendida')
url('flow_state_not_found', 'flow_state_not_found', null, 'otro navegador')
for (const [texto, codigo] of [
  ['una frase en español inventada', 'Tu cuenta está bloqueada. Llama al 600 000 000 para recuperarla'],
  ['una frase en inglés', 'Email link is invalid or has expired'],
  ['un código que no existe', 'no_existe'],
  ['vacío', ''],
] as const) {
  const visto = mensajeDeErrorEnUrl(codigo, null)
  di(visto === MENSAJE_GENERICO, `${texto} -> el genérico, sin mostrar el texto`, visto)
}
di(mensajeDeErrorEnUrl('suspended', 'Llama al 600') .includes('suspendida'), 'un error_code inventado no tapa el código bueno', mensajeDeErrorEnUrl('suspended', 'Llama al 600'))

console.log('\n== El código que se pone en la URL')
di(codigoParaLaUrl({ code: 'otp_expired', message: 'x' }) === 'otp_expired', 'un código conocido pasa tal cual', codigoParaLaUrl({ code: 'otp_expired' }))
di(codigoParaLaUrl({ code: 'raro', message: 'Some English text' }) === 'error_inesperado', 'uno desconocido se cambia por uno propio, nunca el texto', codigoParaLaUrl({ code: 'raro' }))
di(codigoParaLaUrl({ message: 'x' }, 'callback_error') === 'callback_error', 'sin código, el que se pide', codigoParaLaUrl({ message: 'x' }, 'callback_error'))

console.log(fallos ? `\n*** ${fallos} comprobacion(es) mal` : '\nTodo bien')
process.exit(fallos ? 1 : 0)
