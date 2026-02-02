import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  // Extraer todos los parámetros para debugging
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Log completo para debugging
  console.log('[Auth Callback] ===================')
  console.log('[Auth Callback] URL completa:', request.url)
  console.log('[Auth Callback] Params:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    token_hash: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type,
    error: errorParam,
    error_description: errorDescription,
    error_code: errorCode,
    next,
  })

  // Leer redirect de cookie (guardada antes del OAuth)
  const cookieStore = await cookies()
  const redirectTo = cookieStore.get('auth_redirect')?.value
  console.log('[Auth Callback] Cookie redirect:', redirectTo)

  const supabase = await createClient()

  // Si Supabase envió un error en la URL
  if (errorParam) {
    console.error('[Auth Callback] Error de Supabase:', {
      error: errorParam,
      description: errorDescription,
      code: errorCode,
    })

    // Manejar errores específicos
    if (errorParam === 'access_denied') {
      return NextResponse.redirect(`${origin}/login?error=access_denied`)
    }

    // Para recovery con error, mostrar mensaje específico
    if (type === 'recovery') {
      const errorMsg = encodeURIComponent(errorDescription || 'Error en recuperación de contraseña')
      return NextResponse.redirect(`${origin}/forgot-password?error=${errorMsg}`)
    }

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  // =====================================================
  // MÉTODO 1: Token Hash (funciona en cualquier navegador)
  // Usado para recovery cuando el usuario abre en otro navegador
  // =====================================================
  if (token_hash && type) {
    console.log('[Auth Callback] Usando verifyOtp con token_hash...')

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.error('[Auth Callback] Error en verifyOtp:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })

      if (type === 'recovery') {
        const errorMsg = encodeURIComponent(error.message || 'Enlace de recuperación expirado o inválido')
        return NextResponse.redirect(`${origin}/forgot-password?error=${errorMsg}`)
      }

      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || 'otp_error')}`)
    }

    console.log('[Auth Callback] verifyOtp exitoso')
    console.log('[Auth Callback] User ID:', data.user?.id)
    console.log('[Auth Callback] User email:', data.user?.email)

    // Para recovery, ir a la página de reset
    if (type === 'recovery') {
      console.log('[Auth Callback] Recovery via token_hash, redirigiendo a /reset-password')
      const response = NextResponse.redirect(`${origin}/reset-password`)
      response.cookies.delete('auth_redirect')
      return response
    }

    // Para otros tipos (signup, magiclink, etc.)
    return await handleSuccessfulAuth(supabase, data.user, origin, redirectTo || next)
  }

  // =====================================================
  // MÉTODO 2: Code Exchange (PKCE - requiere mismo navegador)
  // =====================================================
  if (code) {
    console.log('[Auth Callback] Usando exchangeCodeForSession (PKCE)...')

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error en exchangeCodeForSession:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })

      // Detectar error de PKCE (code verifier no encontrado)
      const isPKCEError = error.message.toLowerCase().includes('code verifier') ||
                          error.message.toLowerCase().includes('pkce') ||
                          error.message.toLowerCase().includes('invalid flow state')

      if (isPKCEError) {
        console.log('[Auth Callback] Error PKCE detectado, verificando si hay sesión activa...')

        // Verificar si el usuario ya tiene una sesión activa
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session) {
          console.log('[Auth Callback] Usuario ya tiene sesión activa, redirigiendo...')

          // Si es recovery, ir a reset-password
          if (type === 'recovery') {
            const response = NextResponse.redirect(`${origin}/reset-password`)
            response.cookies.delete('auth_redirect')
            return response
          }

          // Para otros casos, ir al dashboard
          return await handleSuccessfulAuth(supabase, sessionData.session.user, origin, redirectTo || next)
        }

        // No hay sesión activa, mostrar mensaje amigable
        console.log('[Auth Callback] No hay sesión activa, mostrando error PKCE amigable')

        if (type === 'recovery') {
          const errorMsg = encodeURIComponent('El enlace ha expirado o fue abierto en un navegador diferente. Por favor, solicita un nuevo enlace de recuperación.')
          return NextResponse.redirect(`${origin}/forgot-password?error=${errorMsg}`)
        }

        if (type === 'magiclink' || type === 'email') {
          const errorMsg = encodeURIComponent('El enlace ha expirado o fue abierto en un navegador diferente. Por favor, solicita un nuevo enlace de acceso.')
          return NextResponse.redirect(`${origin}/login?error=${errorMsg}`)
        }

        const errorMsg = encodeURIComponent('El enlace ha expirado o fue abierto en un navegador diferente. Por favor, intenta iniciar sesión nuevamente.')
        return NextResponse.redirect(`${origin}/login?error=${errorMsg}`)
      }

      // Otros errores no relacionados con PKCE
      if (type === 'recovery') {
        const errorMsg = encodeURIComponent(error.message || 'Enlace de recuperación expirado o inválido')
        return NextResponse.redirect(`${origin}/forgot-password?error=${errorMsg}`)
      }

      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || 'callback_error')}`)
    }

    console.log('[Auth Callback] exchangeCodeForSession exitoso')
    console.log('[Auth Callback] User ID:', data.user?.id)
    console.log('[Auth Callback] User email:', data.user?.email)

    // Si es recovery (reset password), ir a la página de reset
    if (type === 'recovery') {
      console.log('[Auth Callback] Recovery via PKCE, redirigiendo a /reset-password')
      const response = NextResponse.redirect(`${origin}/reset-password`)
      response.cookies.delete('auth_redirect')
      return response
    }

    // Para otros flujos (OAuth, magic link, etc.)
    return await handleSuccessfulAuth(supabase, data.user, origin, redirectTo || next)
  }

  // =====================================================
  // Sin código ni token_hash - verificar sesión existente
  // =====================================================
  console.log('[Auth Callback] Sin código ni token_hash, verificando sesión existente...')

  const { data: existingSession } = await supabase.auth.getSession()

  if (existingSession.session) {
    console.log('[Auth Callback] Sesión existente encontrada, redirigiendo al dashboard')
    return await handleSuccessfulAuth(supabase, existingSession.session.user, origin, redirectTo || next)
  }

  console.log('[Auth Callback] No hay sesión, redirigiendo a login')
  return NextResponse.redirect(`${origin}/login`)
}

/**
 * Maneja la redirección después de una autenticación exitosa
 * Verifica el estado del usuario (suspendido, beta, roles)
 */
async function handleSuccessfulAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string } | null | undefined,
  origin: string,
  redirectTo: string
) {
  if (!user) {
    console.log('[Auth Callback] No hay usuario, redirigiendo a dashboard')
    const response = NextResponse.redirect(`${origin}${redirectTo}`)
    response.cookies.delete('auth_redirect')
    return response
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[Auth Callback] Error obteniendo perfil:', profileError)
  }

  console.log('[Auth Callback] Perfil:', profile)

  // Usuario suspendido
  if (profile?.is_suspended) {
    console.log('[Auth Callback] Usuario suspendido')
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=suspended`)
  }

  // Admin o instructor siempre pasan
  if (profile?.role === 'admin' || profile?.role === 'instructor') {
    console.log('[Auth Callback] Admin/Instructor, acceso completo')
    const response = NextResponse.redirect(`${origin}${redirectTo}`)
    response.cookies.delete('auth_redirect')
    return response
  }

  // Beta access check removed - all authenticated users can access

  // Usuario con acceso
  console.log('[Auth Callback] Redirigiendo a:', redirectTo)
  const response = NextResponse.redirect(`${origin}${redirectTo}`)
  response.cookies.delete('auth_redirect')
  return response
}
