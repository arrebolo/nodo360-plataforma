// app/logout/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Cerrar sesión en Supabase
    await supabase.auth.signOut()

    // Redirigir a la home (pública)
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('[LOGOUT] Error al cerrar sesión:', error)

    // Si algo falla, al menos te llevo a /login
    const fallbackUrl = new URL('/login', request.url)
    return NextResponse.redirect(fallbackUrl)
  }
}

// Opcional: permitir también POST por si en el futuro quieres usar <form method="post">
export async function POST(request: Request) {
  return GET(request)
}
