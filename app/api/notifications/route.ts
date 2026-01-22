import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Notification, NotificationsResponse } from '@/types/database'
import { checkRateLimit } from '@/lib/ratelimit'

// GET - Listar notificaciones del usuario
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Query base
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar solo no leídas si se solicita
    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('❌ [notifications] Error:', error)
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    // Contar no leídas
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    const response: NotificationsResponse = {
      notifications: notifications as Notification[],
      unread_count: unreadCount || 0
    }

    console.log('✅ [notifications] Obtenidas:', notifications?.length, 'Unread:', unreadCount)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [notifications] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
