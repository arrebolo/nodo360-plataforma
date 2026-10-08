import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const servicio = createAdminClient()

    // Obtener info de los otros participantes y último mensaje
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1

        // LA FICHA DEL INTERLOCUTOR, CON EL CLIENTE DE SERVICIO.
        //
        // Antes se leia con la sesion de quien mira, y eso dejara de funcionar
        // con la politica por funcion de la 123: el interlocutor normalmente no
        // es instructor, ni mentor, ni autor de un curso publicado.
        //
        // Se puede usar el servicio porque la lista de conversaciones de arriba
        // ya esta acotada por la RLS a las de esta persona: aqui solo se llega
        // con interlocutores suyos. Y sin `role`: no se publica.
        const { data: otherUser } = await servicio
          .from('users')
          .select('id, full_name, avatar_url')
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
          otherUser: otherUser || { id: otherUserId, full_name: 'Usuario', avatar_url: null },
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

    // COMPROBAR QUE EL DESTINATARIO EXISTE, CON EL CLIENTE DE SERVICIO.
    //
    // ESTE ERA UN FALLO DE VERDAD, y el guardian lo eximia porque la variable se
    // llama `userId`: ese id VIENE DEL CUERPO de la peticion y cuatro lineas mas
    // arriba se comprueba que es DISTINTO del de la sesion. O sea que es, por
    // definicion, la ficha de otra persona leida con la sesion de quien escribe.
    // Con la politica por funcion de la 123 devolveria vacio para cualquier
    // alumno, y abrir una conversacion con el habria contestado «Usuario no
    // encontrado».
    //
    // SOLO `id`, no el nombre: lo unico que hace falta aqui es saber si existe,
    // y asi esta lectura no devuelve ni un dato de nadie. Quien pregunta ya
    // tiene sesion.
    //
    // QUIEN PUEDE ESCRIBIR A QUIEN no se decide aqui: lo decide la base, en la
    // 124 (trigger en conversations y la misma regla dentro de la RPC), porque
    // PostgREST es alcanzable directamente y una regla en esta ruta se saltaria
    // con un INSERT. Aqui solo se traduce su «no» a una respuesta legible.
    const { data: otherUser, error: userError } = await createAdminClient()
      .from('users')
      .select('id')
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
      // 42501 es un «no» con su motivo, no un fallo del servidor: la regla de
      // la 124 («Esta persona no acepta mensajes») o la guarda de identidad de
      // la 034. El mensaje lo escribe la base para quien lo lee, y
      // SendMessageButton lo muestra tal cual.
      if (fnError.code === '42501') {
        return NextResponse.json({ error: fnError.message }, { status: 403 })
      }
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
