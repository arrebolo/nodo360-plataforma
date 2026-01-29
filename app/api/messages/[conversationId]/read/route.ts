import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

/**
 * POST /api/messages/[conversationId]/read
 * Marca todos los mensajes de la conversación como leídos
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario es parte de la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1, participant_2')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    }

    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      return NextResponse.json({ error: 'No tienes acceso a esta conversación' }, { status: 403 })
    }

    // Marcar mensajes como leídos (solo los que NO fueron enviados por el usuario actual)
    const { data: markedCount, error: updateError } = await supabase
      .rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      })

    if (updateError) {
      console.error('[POST /api/messages/[id]/read] Update error:', updateError)
      return NextResponse.json({ error: 'Error al marcar mensajes como leídos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      markedAsRead: markedCount || 0,
    })
  } catch (error) {
    console.error('[POST /api/messages/[id]/read] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
