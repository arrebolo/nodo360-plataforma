import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/welcome-email'

/**
 * Envia el correo de bienvenida, y solo una vez por cuenta.
 *
 * ANTES SE ENVIABA AL REGISTRARSE, que es antes de confirmar la direccion. Eso
 * significaba escribir a direcciones sin verificar —incluidas las mal tecleadas
 * y las de otras personas— y dar por buena una cuenta que todavia no se podia
 * usar.
 *
 * Ahora se envia cuando la direccion queda confirmada, y ese momento llega por
 * caminos distintos:
 *
 *   - registro con contraseña: al pulsar el enlace de confirmacion, que entra
 *     por /auth/callback con token_hash y type=signup;
 *   - registro con Google: no hay confirmacion que pulsar, porque la direccion
 *     ya viene verificada del proveedor, asi que el momento es su primer acceso;
 *   - enlace magico: la direccion se verifica al pulsarlo.
 *
 * NINGUNO DE ESOS MOMENTOS OCURRE UNA SOLA VEZ. El enlace de confirmacion se
 * puede pulsar dos veces, y «su primer acceso» es indistinguible del segundo si
 * no se ha apuntado el primero. Por eso el cerrojo no esta aqui sino en la base:
 * `users.welcome_email_sent_at` (migracion 102).
 *
 * Y NO SE COMPRUEBA ANTES DE RECLAMAR, se reclama. Leer «¿esta a NULL?» y
 * despues escribir deja hueco entre las dos cosas: dos peticiones a la vez leen
 * NULL las dos y envian las dos. El UPDATE condicionado a IS NULL es atomico:
 * quien recibe fila es quien envia, y no hay segundo.
 *
 * ESTO CORRE EN CADA ACCESO, asi que el caso normal —alguien que vuelve— tiene
 * que ser barato: es UNA consulta, el UPDATE que no encuentra fila. Solo cuando
 * se lleva la fila se pregunta por la confirmacion y se envia.
 *
 * Si el envio falla despues de reclamar, la fecha se devuelve a NULL para que el
 * siguiente acceso lo reintente. Reclamar y no enviar dejaria a alguien sin su
 * correo para siempre.
 *
 * No lanza nunca: un correo no puede tumbar un inicio de sesion.
 */
export async function enviarBienvenidaUnaSolaVez(userId: string): Promise<
  | { enviado: true }
  | { enviado: false; motivo: 'ya-enviado' | 'sin-confirmar' | 'sin-usuario' | 'error' }
> {
  const db = createAdminClient()

  /** Libera el cerrojo: reclamado y no enviado es peor que no reclamado. */
  const liberar = async () => {
    const { error } = await db
      .from('users')
      .update({ welcome_email_sent_at: null })
      .eq('id', userId)
    if (error) {
      console.error('[bienvenida] No se pudo liberar el cerrojo:', error.message)
    }
  }

  try {
    // 1. Reclamar. Si no devuelve fila, ya se envio: fin, y ha costado una consulta.
    const { data: reclamada, error: errorReclamo } = await db
      .from('users')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', userId)
      .is('welcome_email_sent_at', null)
      .select('id, email, full_name')

    if (errorReclamo) {
      console.error('[bienvenida] Error al reclamar el envio:', errorReclamo.message)
      return { enviado: false, motivo: 'error' }
    }

    if (!reclamada || reclamada.length === 0) {
      return { enviado: false, motivo: 'ya-enviado' }
    }

    const fila = reclamada[0] as { email: string | null; full_name: string | null }

    // 2. ¿Esta confirmada la direccion?
    //
    // email_confirmed_at vive en auth.users, no en public.users, asi que se
    // pregunta por la API de administracion. Con la confirmacion activada en
    // Supabase no deberia haber sesion sin confirmar, pero la condicion que se
    // pide es «solo cuando confirma», y una condicion que no esta escrita es una
    // condicion que no se cumple el dia que cambia el camino.
    const { data: cuenta, error: errorCuenta } = await db.auth.admin.getUserById(userId)

    if (errorCuenta || !cuenta?.user) {
      console.error('[bienvenida] No se pudo leer la cuenta:', errorCuenta?.message)
      await liberar()
      return { enviado: false, motivo: 'sin-usuario' }
    }

    if (!cuenta.user.email_confirmed_at) {
      console.log('[bienvenida] Direccion sin confirmar, no se envia')
      await liberar()
      return { enviado: false, motivo: 'sin-confirmar' }
    }

    const email = fila.email || cuenta.user.email
    if (!email) {
      await liberar()
      return { enviado: false, motivo: 'sin-usuario' }
    }

    const nombre =
      fila.full_name?.trim() ||
      (cuenta.user.user_metadata?.full_name as string | undefined)?.trim() ||
      email.split('@')[0]

    // 3. Enviar
    const envio = await sendWelcomeEmail({ to: email, userName: nombre })

    if (!envio.success) {
      await liberar()
      console.error('[bienvenida] Envio fallido, se libera el cerrojo:', envio.error)
      return { enviado: false, motivo: 'error' }
    }

    console.log('[bienvenida] Enviado al confirmar la cuenta')
    return { enviado: true }
  } catch (e) {
    console.error('[bienvenida] Error inesperado:', e)
    return { enviado: false, motivo: 'error' }
  }
}
