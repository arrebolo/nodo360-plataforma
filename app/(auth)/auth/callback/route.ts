import { createClient } from '@/lib/supabase/server'
import { codigoParaLaUrl } from '@/lib/auth/error-messages'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'
import { destinoTrasEntrar, metodoDeRegistro } from '@/lib/auth/tras-verificar'
import { destinoInterno } from '@/lib/navegacion/destino-interno'

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
  // El destino, solo si es de este sitio: ?next=//otro-sitio.com redirigia fuera
  const next = destinoInterno(requestUrl.searchParams.get('next'))

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
  const guardado = cookieStore.get('auth_redirect')?.value
  const redirectTo = guardado ? destinoInterno(guardado, next) : undefined
  console.log('[Auth Callback] Cookie redirect:', redirectTo)

  const supabase = await createClient()

  // Si Supabase envió un error en la URL
  if (errorParam) {
    console.error('[Auth Callback] Error de Supabase:', {
      error: errorParam,
      description: errorDescription,
      code: errorCode,
    })

    // A la URL va el CODIGO, no la descripcion (que viene en ingles). Y el
    // error_code manda sobre el error: un enlace caducado llega como
    // error=access_denied&error_code=otp_expired, y por mirar solo el primero se
    // le decia al usuario «cancelaste el inicio de sesion».
    const codigo = encodeURIComponent(errorCode || errorParam)
    const destino = type === 'recovery' ? 'forgot-password' : 'login'
    return NextResponse.redirect(`${origin}/${destino}?error=${codigo}`)
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

      const codigo = codigoParaLaUrl(error, 'enlace_invalido')
      const destino = type === 'recovery' ? 'forgot-password' : 'login'
      return NextResponse.redirect(`${origin}/${destino}?error=${codigo}`)
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

        const destino = type === 'recovery' ? 'forgot-password' : 'login'
        return NextResponse.redirect(`${origin}/${destino}?error=flow_state_not_found`)
      }

      // Otros errores no relacionados con PKCE
      const codigo = codigoParaLaUrl(error, 'callback_error')
      const destino = type === 'recovery' ? 'forgot-password' : 'login'
      return NextResponse.redirect(`${origin}/${destino}?error=${codigo}`)
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
 * La respuesta para quien acaba de entrar: el destino lo decide
 * destinoTrasEntrar (lib/auth/tras-verificar.ts), compartido con /auth/confirmar.
 */
async function handleSuccessfulAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string } | null | undefined,
  origin: string,
  redirectTo: string,
  metodoRegistro: string | null = null
) {
  const response = NextResponse.redirect(
    await destinoTrasEntrar(supabase, user, origin, redirectTo, metodoRegistro)
  )
  response.cookies.delete('auth_redirect')
  return response
}
