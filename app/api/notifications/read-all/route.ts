import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH - Marcar todas las notificaciones como leídas
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Actualizar todas las no leídas del usuario
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .select()

    if (error) {
      console.error('❌ [notifications/read-all] Error:', error)
      return NextResponse.json(
        { error: 'Error al marcar notificaciones' },
        { status: 500 }
      )
    }

    const count = data?.length || 0
    console.log('✅ [notifications/read-all] Marcadas como leídas:', count)

    return NextResponse.json({
      success: true,
      count
    })

  } catch (error) {
    console.error('❌ [notifications/read-all] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
