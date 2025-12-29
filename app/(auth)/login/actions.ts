'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirectAfterLogin } from '@/lib/auth/redirect-after-login'

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

  console.log('🔍 [Auth Actions] Iniciando Magic Link para:', email)

  if (!email) {
    console.error('❌ [Auth Actions] Email no proporcionado')
    return { success: false, message: 'Email es requerido', error: 'EMAIL_REQUIRED' }
  }

  try {
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

  console.log('🔍 [Auth Actions] Iniciando sesión con password:', email)
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
    console.error('❌ [Auth Actions] Error inesperado:', error)
    redirect('/login?error=Error+inesperado')
  }
}

/**
 * Registrar nuevo usuario con email y contraseña
 */
export async function signUp(formData: FormData): Promise<void> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  console.log('🔍 [Auth Actions] Registrando usuario:', email)

  if (!email || !password) {
    console.error('❌ [Auth Actions] Datos incompletos')
    redirect('/login?error=Datos+incompletos')
  }

  try {
    const supabase = await createClient()
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

    const { error } = await supabase.auth.signUp({
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
      console.error('❌ [Auth Actions] Error en registro:', error.message)
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log('✅ [Auth Actions] Registro exitoso')
    redirect('/login?success=Cuenta+creada.+Revisa+tu+email')
  } catch (error) {
    console.error('❌ [Auth Actions] Error inesperado:', error)
    redirect('/login?error=Error+inesperado')
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
    console.error('❌ [Auth Actions] Error inesperado:', error)
    redirect('/login?error=Error+al+cerrar+sesión')
  }
}
