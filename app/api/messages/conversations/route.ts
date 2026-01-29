import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/messages/conversations
 * Lista todas las conversaciones del usuario actual
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener conversaciones donde el usuario es participante
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participant_1,
        participant_2,
        last_message_at,
        created_at
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('[GET /api/messages/conversations] Error:', error)
      return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500 })
    }

    // Obtener info de los otros participantes y último mensaje
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1

        // Info del otro usuario
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, role')
          .eq('id', otherUserId)
          .single()

        // Último mensaje
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at, read_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Contar mensajes no leídos (enviados por el otro usuario)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_id', otherUserId)
          .is('read_at', null)

        return {
          id: conv.id,
          otherUser: otherUser || { id: otherUserId, full_name: 'Usuario', avatar_url: null, role: 'student' },
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at,
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithDetails })
  } catch (error) {
    console.error('[GET /api/messages/conversations] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * POST /api/messages/conversations
 * Crea o obtiene una conversación con otro usuario
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'No puedes crear una conversación contigo mismo' }, { status: 400 })
    }

    // Verificar que el otro usuario existe
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', userId)
      .single()

    if (userError || !otherUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Usar la función de base de datos para obtener o crear
    const { data: conversationId, error: fnError } = await supabase
      .rpc('get_or_create_conversation', {
        p_user_1: user.id,
        p_user_2: userId,
      })

    if (fnError) {
      console.error('[POST /api/messages/conversations] RPC error:', fnError)
      return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 })
    }

    return NextResponse.json({
      conversationId,
      message: 'Conversación obtenida/creada exitosamente'
    })
  } catch (error) {
    console.error('[POST /api/messages/conversations] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
