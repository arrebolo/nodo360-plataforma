import { createClient } from '@/lib/supabase/server'
import { getMiPerfil } from '@/lib/auth/miPerfil'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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
function metodoDeRegistro(
  user: User | null | undefined,
  type: EmailOtpType | null
): 'google' | 'github' | 'magic_link' | null {
  if (!user?.created_at) return null

  const edad = Date.now() - new Date(user.created_at).getTime()
  if (!Number.isFinite(edad) || edad < 0 || edad > MARGEN_CUENTA_NUEVA_MS) return null

  const proveedor = user.app_metadata?.provider
  if (proveedor === 'google' || proveedor === 'github') return proveedor

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
    return await handleSuccessfulAuth(
      supabase,
      data.user,
      origin,
      redirectTo || next,
      metodoDeRegistro(data.user, type)
    )
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

          // Para otros casos, ir al dashboard. Sin sign_up: si ya había
          // sesión activa, esta vuelta no ha creado ninguna cuenta.
          return await handleSuccessfulAuth(supabase, sessionData.session.user, origin, redirectTo || next, null)
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
    return await handleSuccessfulAuth(
      supabase,
      data.user,
      origin,
      redirectTo || next,
      metodoDeRegistro(data.user, type)
    )
  }

  // =====================================================
  // Sin código ni token_hash - verificar sesión existente
  // =====================================================
  console.log('[Auth Callback] Sin código ni token_hash, verificando sesión existente...')

  const { data: existingSession } = await supabase.auth.getSession()

  if (existingSession.session) {
    console.log('[Auth Callback] Sesión existente encontrada, redirigiendo al dashboard')
    return await handleSuccessfulAuth(supabase, existingSession.session.user, origin, redirectTo || next, null)
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
  redirectTo: string,
  /**
   * Método de registro, si este callback ha creado la cuenta. Se añade a la
   * URL como ?signup=<método> para que SignUpTracker emita el evento en el
   * cliente: aquí, en el servidor, no hay dataLayer al que escribir.
   */
  metodoRegistro: string | null = null
) {
  const destino = destinoConRegistro(origin, redirectTo, metodoRegistro)

  if (metodoRegistro) {
    console.log('📊 [Auth Callback] Cuenta nueva por', metodoRegistro)
  }

  if (!user) {
    console.log('[Auth Callback] No hay usuario, redirigiendo a dashboard')
    const response = NextResponse.redirect(destino)
    response.cookies.delete('auth_redirect')
    return response
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
    return NextResponse.redirect(`${origin}/login?error=suspended`)
  }

  // Admin o instructor siempre pasan
  if (profile?.role === 'admin' || profile?.role === 'instructor') {
    console.log('[Auth Callback] Admin/Instructor, acceso completo')
    const response = NextResponse.redirect(destino)
    response.cookies.delete('auth_redirect')
    return response
  }

  // Beta access check removed - all authenticated users can access

  // Usuario con acceso
  console.log('[Auth Callback] Redirigiendo a:', redirectTo)
  const response = NextResponse.redirect(destino)
  response.cookies.delete('auth_redirect')
  return response
}
