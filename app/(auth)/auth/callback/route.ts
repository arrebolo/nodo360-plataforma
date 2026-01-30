import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  // Extraer todos los parámetros para debugging
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')

  // Log completo para debugging
  console.log('[Auth Callback] ===================')
  console.log('[Auth Callback] URL completa:', request.url)
  console.log('[Auth Callback] Params:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    type,
    error: errorParam,
    error_description: errorDescription,
    error_code: errorCode,
  })

  // Leer redirect de cookie (guardada antes del OAuth)
  const cookieStore = await cookies()
  const redirectTo = cookieStore.get('auth_redirect')?.value
  console.log('[Auth Callback] Cookie redirect:', redirectTo)

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

  // Si hay código, intercambiarlo por sesión
  if (code) {
    console.log('[Auth Callback] Intercambiando código por sesión...')

    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error en exchangeCodeForSession:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })

      // Si es recovery y falla, ir a forgot-password con error
      if (type === 'recovery') {
        const errorMsg = encodeURIComponent(error.message || 'Enlace de recuperación expirado o inválido')
        return NextResponse.redirect(`${origin}/forgot-password?error=${errorMsg}`)
      }

      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || 'callback_error')}`)
    }

    console.log('[Auth Callback] Sesión establecida correctamente')
    console.log('[Auth Callback] User ID:', data.user?.id)
    console.log('[Auth Callback] User email:', data.user?.email)

    // Si es recovery (reset password), ir a la página de reset
    if (type === 'recovery') {
      console.log('[Auth Callback] Recovery detectado, redirigiendo a /reset-password')
      const response = NextResponse.redirect(`${origin}/reset-password`)
      response.cookies.delete('auth_redirect')
      return response
    }

    // Verificar estado del usuario para redirecciones normales
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, is_beta, is_suspended')
        .eq('id', data.user.id)
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
        const response = NextResponse.redirect(`${origin}${redirectTo || '/dashboard'}`)
        response.cookies.delete('auth_redirect')
        return response
      }

      // Usuario normal sin acceso beta
      if (!profile?.is_beta) {
        console.log('[Auth Callback] Usuario sin acceso beta')
        const response = NextResponse.redirect(`${origin}/beta`)
        response.cookies.delete('auth_redirect')
        return response
      }
    }

    // Usuario con acceso, redirigir al dashboard o redirect guardado
    console.log('[Auth Callback] Redirigiendo a:', redirectTo || '/dashboard')
    const response = NextResponse.redirect(`${origin}${redirectTo || '/dashboard'}`)
    response.cookies.delete('auth_redirect')
    return response
  }

  // Si no hay código ni error, puede ser un flujo de hash (manejado en cliente)
  // O un acceso directo a /auth/callback sin parámetros
  console.log('[Auth Callback] Sin código ni error, redirigiendo a login')
  return NextResponse.redirect(`${origin}/login`)
}
