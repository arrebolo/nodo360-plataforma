import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // Rate limiting (auth)
  const rateLimitResponse = await checkRateLimit(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse
  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = new URL('/', request.url)
  return NextResponse.redirect(url)
}

export async function POST(request: Request) {
  // Rate limiting (auth)
  const rateLimitResponse = await checkRateLimit(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  try {
    console.log('[Logout] Iniciando cierre de sesion')

    const supabase = await createClient()

    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ [Logout] Error al cerrar sesión:', error)
      return NextResponse.json(
        { error: 'Error al cerrar sesión' },
        { status: 500 }
      )
    }

    console.log('✅ [Logout] Sesión cerrada correctamente')

    // Responder con éxito
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [Logout] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}


