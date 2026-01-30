'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirectAfterLogin } from '@/lib/auth/redirect-after-login'
import { sendWelcomeEmail } from '@/lib/email/welcome-email'

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
        message: error.message,
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
      message: 'Error inesperado al enviar Magic Link',
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
 */
async function validateAndConsumeInvite(code: string, userId: string): Promise<{ valid: boolean; error?: string }> {
  if (!code) return { valid: false, error: 'Código de invitación requerido' }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'
    const res = await fetch(`${baseUrl}/api/invites/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase(), userId }),
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

  console.log('[Auth] Registrando nuevo usuario')

  if (!email || !password) {
    console.error('[Auth Actions] Datos incompletos')
    return { success: false, message: 'Email y contraseña son requeridos', error: 'INCOMPLETE_DATA' }
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
      console.error('[Auth Actions] Error en registro:', error.message, error.code)

      // Manejar errores específicos con mensajes en español
      if (error.message.includes('already registered') || error.code === 'user_already_exists') {
        return {
          success: false,
          message: 'Este email ya está registrado. Quieres iniciar sesion?',
          error: 'EMAIL_EXISTS',
        }
      }

      if (error.message.includes('password') || error.code === 'weak_password') {
        return {
          success: false,
          message: 'La contrasena debe tener al menos 6 caracteres',
          error: 'WEAK_PASSWORD',
        }
      }

      return {
        success: false,
        message: error.message,
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

    console.log('[Auth Actions] Registro exitoso')
    return {
      success: true,
      message: 'Cuenta creada exitosamente',
    }
  } catch (error) {
    console.error('[Auth Actions] Error inesperado:', error)
    return {
      success: false,
      message: 'Error inesperado al crear la cuenta',
      error: 'UNEXPECTED_ERROR',
    }
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


