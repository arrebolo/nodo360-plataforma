'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirectAfterLogin } from '@/lib/auth/redirect-after-login'
import { sendWelcomeEmail } from '@/lib/email/welcome-email'
import {
  findSpanishErrorMessage,
  getMessageByCode,
  MENSAJE_GENERICO,
} from '@/lib/auth/error-messages'

/**
 * Helper para detectar errores de redirect de Next.js
 * En Next.js 14+, redirect() lanza un error especial que debe ser re-lanzado
 */
function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'digest' in error &&
    typeof (error as any).digest === 'string' &&
    (error as any).digest.startsWith('NEXT_REDIRECT')
  )
}

/**
 * Traduce un error de Supabase Auth a un mensaje en español.
 *
 * Único punto de traducción de este fichero. Antes cada acción tenía sus
 * propios textos escritos a mano, con dos consecuencias: iban sin tildes
 * («La contrasena debe tener al menos 6 caracteres», «Quieres iniciar
 * sesion?») y podían contradecir al mapa central, que ya decía lo mismo mejor.
 * Peor todavía: el registro comprobaba `error.message.includes('password')` y
 * respondía «al menos 6 caracteres» para CUALQUIER problema de contraseña,
 * incluida una demasiado larga.
 *
 * El texto manda sobre el código porque es más específico: 'weak_password' no
 * distingue corta de larga, y el mensaje de Supabase sí.
 */
function mensajeDeError(error: { message?: string; code?: string }): string {
  return (
    findSpanishErrorMessage(error.message) ??
    getMessageByCode(error.code) ??
    MENSAJE_GENERICO
  )
}

/**
 * Tipos de proveedor OAuth soportados
 */
export type OAuthProvider = 'google' | 'github'

/**
 * Resultado de una acción de autenticación
 */
export interface AuthResult {
  success: boolean
  message: string
  error?: string
  /**
   * El registro ha ido bien pero Supabase no ha devuelto sesión: la
   * confirmación de email está activada y la cuenta todavía no es usable.
   *
   * Sin esto, el cliente hacía `router.push('/dashboard')` nada más ver
   * `success: true`, el middleware no encontraba sesión y devolvía a /login
   * sin explicar nada. Quien acababa de registrarse veía la pantalla de acceso
   * otra vez, que se parece mucho a que el registro haya fallado.
   */
  needsEmailConfirmation?: boolean
  /** Email con el que se registró, para mostrarlo y poder reenviar el correo. */
  email?: string
}

/**
 * Iniciar sesión con Magic Link (email sin contraseña)
 * Envía un email con enlace mágico para iniciar sesión
 */
export async function signInWithEmail(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const redirectTo = formData.get('redirect') as string | null

  console.log('[Auth] Iniciando Magic Link')
  console.log('🔍 [Auth Actions] Redirect después de login:', redirectTo)

  if (!email) {
    console.error('❌ [Auth Actions] Email no proporcionado')
    return { success: false, message: 'Email es requerido', error: 'EMAIL_REQUIRED' }
  }

  try {
    // Guardar redirect en cookie (igual que OAuth)
    if (redirectTo && redirectTo.startsWith('/')) {
      const cookieStore = await cookies()
      cookieStore.set('auth_redirect', redirectTo, {
        path: '/',
        maxAge: 60 * 5, // 5 minutos
        httpOnly: true,
        sameSite: 'lax',
      })
      console.log('✅ [Auth Actions] Cookie auth_redirect guardada:', redirectTo)
    }

    const supabase = await createClient()
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      console.error('❌ [Auth Actions] Error en Magic Link:', error.message)
      return {
        success: false,
        message: mensajeDeError(error),
        error: error.code || 'MAGIC_LINK_ERROR',
      }
    }

    console.log('✅ [Auth Actions] Magic Link enviado exitosamente')
    return {
      success: true,
      message: 'Revisa tu correo para el enlace mágico',
    }
  } catch (error) {
    console.error('❌ [Auth Actions] Error inesperado:', error)
    return {
      success: false,
      message: MENSAJE_GENERICO,
      error: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Iniciar sesión con email y contraseña
 */
export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  console.log('[Auth] Iniciando sesión con password')
  console.log('🔍 [Auth Actions] Redirect después de login:', redirectTo)

  if (!email || !password) {
    console.error('❌ [Auth Actions] Credenciales incompletas')
    redirect('/login?error=Credenciales+incompletas')
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ [Auth Actions] Error en login:', error.message)
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log('✅ [Auth Actions] Login exitoso')

    // Usar redirect personalizado o el default
    if (redirectTo && redirectTo !== '/') {
      redirect(redirectTo)
    } else {
      await redirectAfterLogin()
    }
  } catch (error) {
    // Re-lanzar si es un redirect (NO es un error real)
    if (isRedirectError(error)) {
      throw error
    }
    console.error('❌ [Auth Actions] Error inesperado:', error)
    redirect('/login?error=Error+inesperado')
  }
}

/**
 * Validar y consumir código de invitación (server-side)
 * NOTA: Función reservada para uso futuro con cursos premium
 * Ya no se usa para registro (beta abierta)
 *
 * ⚠️ NO FUNCIONA TAL CUAL. Desde el endurecimiento de /api/invites/consume, el
 * endpoint toma el usuario de la sesión y ya no acepta un userId del cuerpo.
 * Este fetch de servidor a servidor no reenvía las cookies, así que recibiría
 * un 401. Al revivir el flujo de invitación, lo correcto es extraer la lógica
 * del endpoint a un módulo de lib/ y llamarla directamente desde aquí, en vez
 * de que el servidor se llame a sí mismo por HTTP.
 */
async function validateAndConsumeInvite(code: string): Promise<{ valid: boolean; error?: string }> {
  if (!code) return { valid: false, error: 'Código de invitación requerido' }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'
    const res = await fetch(`${baseUrl}/api/invites/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() }),
    })

    const data = await res.json()

    if (!data.ok) {
      const messages: Record<string, string> = {
        not_found: 'Código de invitación no válido',
        inactive: 'Este código ya no está activo',
        expired: 'Este código ha expirado',
        used_up: 'Este código ha alcanzado el límite de usos',
      }
      return { valid: false, error: messages[data.error] || 'Error al validar código' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Error al validar código de invitación' }
  }
}

/**
 * Registrar nuevo usuario con email y contraseña
 * Beta abierta - No requiere código de invitación
 * Retorna AuthResult para manejar errores en el cliente
 */
export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const acceptTerms = formData.get('acceptTerms')

  console.log('[Auth] Registrando nuevo usuario')

  if (!email || !password) {
    console.error('❌ [Auth Actions] Datos incompletos')
    return { success: false, message: 'Email y contraseña son requeridos', error: 'INCOMPLETE_DATA' }
  }

  // La casilla de términos también se comprueba aquí, no solo en el navegador.
  // El `required` del formulario se salta con cualquier POST directo, y la
  // aceptación es justo lo que hay que poder demostrar después.
  if (!acceptTerms) {
    console.error('❌ [Auth Actions] Términos no aceptados')
    return {
      success: false,
      message: 'Tienes que aceptar los Términos de Servicio y la Política de Privacidad para crear la cuenta.',
      error: 'TERMS_NOT_ACCEPTED',
    }
  }

  try {
    const supabase = await createClient()
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.error('❌ [Auth Actions] Error en registro:', error.message, error.code)
      return {
        success: false,
        message: mensajeDeError(error),
        error: error.code || 'SIGNUP_ERROR',
      }
    }

    // Enviar email de bienvenida (no bloquea el flujo)
    if (data.user) {
      try {
        await sendWelcomeEmail({
          to: email,
          userName: fullName || email.split('@')[0],
        })
        console.log('[Auth Actions] Email de bienvenida enviado')
      } catch (emailError) {
        // No fallar el registro por error de email
        console.error('[Auth Actions] Error enviando email de bienvenida:', emailError)
      }
    }

    // Con la confirmación de email activada, Supabase crea el usuario pero NO
    // devuelve sesión. Es un registro correcto al que le falta un paso, y hay
    // que decirlo: es la diferencia entre «revisa tu correo» y un rebote
    // silencioso a /login.
    const haySesion = Boolean(data.session)

    console.log(
      haySesion
        ? '✅ [Auth Actions] Registro exitoso con sesión'
        : '📧 [Auth Actions] Registro exitoso, pendiente de confirmar el email'
    )

    return {
      success: true,
      message: haySesion
        ? 'Cuenta creada exitosamente'
        : 'Te hemos enviado un correo para confirmar tu cuenta',
      needsEmailConfirmation: !haySesion,
      email,
    }
  } catch (error) {
    console.error('❌ [Auth Actions] Error inesperado:', error)
    return {
      success: false,
      message: MENSAJE_GENERICO,
      error: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Reenviar el correo de confirmación de un registro.
 *
 * Lo pide la pantalla «Revisa tu correo»: el primer correo se pierde en spam
 * con bastante frecuencia, y sin esto la única salida era registrarse otra vez
 * —que devuelve «este correo ya está registrado»— o escribir a soporte.
 */
export async function resendSignUpConfirmation(email: string): Promise<AuthResult> {
  if (!email) {
    return { success: false, message: 'Email es requerido', error: 'EMAIL_REQUIRED' }
  }

  console.log('🔍 [Auth Actions] Reenviando confirmación de registro')

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('❌ [Auth Actions] Error al reenviar la confirmación:', error.message)
      return {
        success: false,
        message: mensajeDeError(error),
        error: error.code || 'RESEND_ERROR',
      }
    }

    console.log('✅ [Auth Actions] Confirmación reenviada')
    return {
      success: true,
      message: 'Te lo hemos enviado otra vez. Revisa tu correo.',
      email,
    }
  } catch (error) {
    console.error('❌ [Auth Actions] Error inesperado al reenviar:', error)
    return { success: false, message: MENSAJE_GENERICO, error: 'UNEXPECTED_ERROR' }
  }
}

/**
 * Iniciar sesión con OAuth (Google, GitHub)
 * @param provider - Proveedor OAuth
 * @param redirectTo - URL a la que redirigir después del login
 */
export async function signInWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<void> {
  console.log('🔍 [Auth Actions] Iniciando OAuth con:', provider)
  console.log('🔍 [Auth Actions] Redirect después de login:', redirectTo)

  try {
    // Guardar redirect en cookie para usarlo después del callback
    if (redirectTo) {
      const cookieStore = await cookies()
      cookieStore.set('auth_redirect', redirectTo, {
        path: '/',
        maxAge: 60 * 5, // 5 minutos
        httpOnly: true,
        sameSite: 'lax',
      })
    }

    const supabase = await createClient()
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

    console.log('🔍 [OAuth] URL de callback:', callbackUrl)
    console.log('🔍 [OAuth] Provider seleccionado:', provider)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      console.error('❌ [OAuth] Error completo:', error)
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data.url) {
      console.log('✅ [OAuth] URL de autorización recibida:', data.url)
      redirect(data.url)
    } else {
      console.error('❌ [OAuth] No se recibió URL de autorización')
      redirect('/login?error=No+se+recibió+URL+de+autorización')
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    console.error('❌ [Auth Actions] Error inesperado en OAuth:', error)
    redirect('/login?error=Error+con+OAuth')
  }
}

/**
 * Cerrar sesión
 */
export async function signOut(): Promise<void> {
  console.log('🔍 [Auth Actions] Cerrando sesión')

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ [Auth Actions] Error al cerrar sesión:', error.message)
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log('✅ [Auth Actions] Sesión cerrada')
    redirect('/login')
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    console.error('❌ [Auth Actions] Error inesperado:', error)
    redirect('/login?error=Error+al+cerrar+sesión')
  }
}


