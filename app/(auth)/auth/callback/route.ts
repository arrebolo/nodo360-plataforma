import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  console.log('[Auth Callback] Iniciando...')
  console.log('[Auth Callback] Type:', type)

  // Leer redirect de cookie (guardada antes del OAuth)
  const cookieStore = await cookies()
  const redirectTo = cookieStore.get('auth_redirect')?.value

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }

    console.log('[Auth Callback] Sesion establecida')

    // Si es recovery (reset password)
    if (type === 'recovery') {
      console.log('[Auth Callback] Recovery detectado')
      const response = NextResponse.redirect(`${origin}/auth/reset-password`)
      response.cookies.delete('auth_redirect')
      return response
    }

    // Verificar estado del usuario para redirecciones normales
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role, is_beta, is_suspended')
        .eq('id', data.user.id)
        .single()

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
  }

  // Limpiar cookie de redirect y redirigir
  const response = NextResponse.redirect(`${origin}${redirectTo || '/dashboard'}`)
  response.cookies.delete('auth_redirect')

  return response
}
