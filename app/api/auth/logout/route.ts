import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🚪 [Logout] Iniciando cierre de sesión')

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
