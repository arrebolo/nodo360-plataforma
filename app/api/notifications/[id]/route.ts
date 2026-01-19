import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH - Marcar notificación como leída
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Actualizar notificación (solo si pertenece al usuario - RLS lo garantiza)
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('❌ [notifications/id] Error:', error)
      return NextResponse.json(
        { error: 'Error al actualizar notificación' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ [notifications/id] Marcada como leída:', id)

    return NextResponse.json({ success: true, notification: data })

  } catch (error) {
    console.error('❌ [notifications/id] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar notificación (opcional)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ [notifications/id] Error al eliminar:', error)
      return NextResponse.json(
        { error: 'Error al eliminar notificación' },
        { status: 500 }
      )
    }

    console.log('✅ [notifications/id] Eliminada:', id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ [notifications/id] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
