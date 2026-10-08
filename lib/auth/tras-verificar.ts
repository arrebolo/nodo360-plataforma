/**
 * Lo que pasa justo después de verificar a alguien, compartido por los dos sitios
 * por los que se entra: /auth/callback (Google, y los enlaces de correo enviados
 * antes de /auth/confirmar) y /auth/confirmar (los enlaces de correo con
 * token_hash). Estaba dentro de la ruta del callback; se saca para que los dos
 * caminos no puedan divergir en la suspensión, la bienvenida o el sign_up.
 */
import type { createClient } from '@/lib/supabase/server'
import { getMiPerfil } from '@/lib/auth/miPerfil'
import { enviarBienvenidaUnaSolaVez } from '@/lib/email/bienvenida-una-sola-vez'
import type { EmailOtpType, User } from '@supabase/supabase-js'

/**
 * Cuánto margen se da para considerar que una cuenta acaba de nacer.
 *
 * Supabase no dice «este login ha creado el usuario»: hay que deducirlo. La
 * señal fiable es `created_at`, que para quien vuelve es de hace días o meses.
 * Un minuto sobra para el ida y vuelta al proveedor y no llega para confundir a
 * un usuario que regresa.
 */
const MARGEN_CUENTA_NUEVA_MS = 60 * 1000

/**
 * Método de registro que hay que atribuir a este callback, o null si no es un
 * registro.
 *
 * OJO con `type === 'signup'`: ése es el enlace de confirmación del registro
 * con contraseña, y ese sign_up ya lo emite el formulario en cuanto la cuenta se
 * crea. Emitirlo también aquí contaría dos veces el mismo registro en cuanto se
 * active la confirmación de email en Supabase.
 */
export function metodoDeRegistro(
  user: User | null | undefined,
  type: EmailOtpType | null
): 'google' | 'magic_link' | null {
  if (!user?.created_at) return null

  const edad = Date.now() - new Date(user.created_at).getTime()
  if (!Number.isFinite(edad) || edad < 0 || edad > MARGEN_CUENTA_NUEVA_MS) return null

  // Solo Google: es el único proveedor externo habilitado en Supabase.
  const proveedor = user.app_metadata?.provider
  if (proveedor === 'google') return proveedor

  // Sin proveedor externo, la cuenta se creó con un enlace mágico: signInWithOtp
  // da de alta al usuario que no existe. El registro con contraseña queda fuera
  // a propósito (lo emite el formulario).
  if (type === 'magiclink' || type === 'email') return 'magic_link'

  return null
}

/** Añade ?signup=<método> al destino, respetando la query que ya traiga. */
function destinoConRegistro(
  origin: string,
  redirectTo: string,
  metodo: string | null
): string {
  const url = new URL(redirectTo, origin)
  if (metodo) url.searchParams.set('signup', metodo)
  return url.toString()
}

/**
 * Añade ?email_confirmed=<método> al destino.
 *
 * Mismo problema que con sign_up y la misma solución: aquí es código de
 * servidor y no hay dataLayer al que escribir, así que el cliente se entera por
 * la URL y SignUpTracker emite el evento.
 *
 * El método de `metodoDeRegistro()` deja fuera el registro con contraseña a
 * propósito —ese sign_up lo emite el formulario—, así que cuando no hay método
 * y estamos aquí confirmando, el método es «email».
 */
function destinoConConfirmacion(destino: string, metodo: string | null): string {
  const url = new URL(destino)
  url.searchParams.set('email_confirmed', metodo ?? 'email')
  return url.toString()
}

/**
 * A dónde va quien acaba de entrar (por /auth/callback o por /auth/confirmar):
 * comprueba la suspensión, envía la bienvenida si toca y marca el registro y la
 * confirmación en la URL. Devuelve la URL; la respuesta la arma quien llama, que
 * borra además la cookie auth_redirect.
 */
export async function destinoTrasEntrar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string } | null | undefined,
  origin: string,
  redirectTo: string,
  /**
   * Método de registro, si este callback ha creado la cuenta. Se añade a la
   * URL como ?signup=<método> para que SignUpTracker emita el evento en el
   * cliente: aquí, en el servidor, no hay dataLayer al que escribir.
   */
  metodoRegistro: string | null = null
): Promise<string> {
  const destino = destinoConRegistro(origin, redirectTo, metodoRegistro)

  if (metodoRegistro) {
    console.log('📊 [Auth Callback] Cuenta nueva por', metodoRegistro)
  }

  if (!user) {
    console.log('[Auth Callback] No hay usuario, redirigiendo a dashboard')
    return destino
  }

  // is_suspended no es una columna publica desde la 049: va por mi_perfil().
  const profile = await getMiPerfil()

  if (!profile) {
    console.error('[Auth Callback] No se pudo leer el perfil del usuario')
  }

  // Solo lo que hace falta para decidir: mi_perfil() devuelve la fila entera
  // y volcarla aqui meteria el correo en los registros del servidor.
  console.log('[Auth Callback] Perfil:', { role: profile?.role, is_suspended: profile?.is_suspended })

  // Usuario suspendido
  if (profile?.is_suspended) {
    console.log('[Auth Callback] Usuario suspendido')
    await supabase.auth.signOut()
    return `${origin}/login?error=suspended`
  }

  // EL CORREO DE BIENVENIDA SE ENVIA AQUI, y no en el registro.
  //
  // Este es el punto por el que pasan los tres caminos que confirman una
  // direccion: el enlace de confirmacion del registro con contraseña
  // (token_hash + type=signup), la vuelta de Google —que trae la direccion ya
  // verificada, asi que su momento es el primer acceso— y el enlace magico.
  // Una sola llamada cubre los tres, y el cerrojo de la base decide si toca.
  //
  // VA AQUI, y no mas abajo, porque mas abajo hay un retorno anticipado para
  // admin e instructor: puesto despues, esos dos roles no lo recibirian nunca.
  // Y va DESPUES de la comprobacion de suspension, porque a una cuenta suspendida
  // no se le da la bienvenida.
  //
  // Se espera el resultado a proposito. En una funcion sin servidor, una promesa
  // suelta se muere cuando se devuelve la respuesta, y el correo se quedaria sin
  // enviar unas veces de cada tantas sin que nada lo registre. Para quien
  // simplemente vuelve, esto es UNA consulta que no encuentra fila.
  const bienvenida = await enviarBienvenidaUnaSolaVez(user.id)

  // `primeraVez` es el instante en que esta cuenta pasa a ser real: la direccion
  // esta confirmada y nadie lo habia apuntado antes. Es el mismo cerrojo que usa
  // el correo de bienvenida, asi que no hace falta una segunda marca en la base.
  const destinoFinal = bienvenida.primeraVez
    ? destinoConConfirmacion(destino, metodoRegistro)
    : destino

  if (bienvenida.primeraVez) {
    console.log('📊 [Auth Callback] Correo confirmado por primera vez')
  }

  // Admin o instructor siempre pasan
  if (profile?.role === 'admin' || profile?.role === 'instructor') {
    console.log('[Auth Callback] Admin/Instructor, acceso completo')
    return destinoFinal
  }

  // Beta access check removed - all authenticated users can access

  // Usuario con acceso
  console.log('[Auth Callback] Redirigiendo a:', redirectTo)
  return destinoFinal
}
