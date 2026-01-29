import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/messages/unread
 * Obtiene el conteo total de mensajes no leídos del usuario
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Usar la función de base de datos
    const { data: unreadCount, error } = await supabase
      .rpc('get_unread_message_count', {
        p_user_id: user.id,
      })

    if (error) {
      console.error('[GET /api/messages/unread] Error:', error)
      return NextResponse.json({ error: 'Error al obtener conteo' }, { status: 500 })
    }

    return NextResponse.json({ unreadCount: unreadCount || 0 })
  } catch (error) {
    console.error('[GET /api/messages/unread] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
