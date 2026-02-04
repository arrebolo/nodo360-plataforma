import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { scanMessage } from '@/lib/moderation/message-scanner'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

/**
 * GET /api/messages/[conversationId]
 * Obtiene los mensajes de una conversación
 */
export async function GET(
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

    // Parámetros de paginación
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener mensajes
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, sender_id, content, read_at, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (msgError) {
      console.error('[GET /api/messages/[id]] Error:', msgError)
      return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 })
    }

    // Obtener info de ambos participantes
    const otherUserId = conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1

    const { data: otherUser } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .eq('id', otherUserId)
      .single()

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: otherUser || { id: otherUserId, full_name: 'Usuario', avatar_url: null, role: 'student' },
      },
      messages: messages || [],
      pagination: {
        limit,
        offset,
        hasMore: (messages?.length || 0) === limit,
      },
    })
  } catch (error) {
    console.error('[GET /api/messages/[id]] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * POST /api/messages/[conversationId]
 * Envía un mensaje en una conversación
 * Body: { content: string }
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

    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    const trimmedContent = content.trim()

    if (trimmedContent.length === 0) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
    }

    if (trimmedContent.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no puede exceder 5000 caracteres' }, { status: 400 })
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

    // Insertar mensaje
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedContent,
      })
      .select('id, sender_id, content, read_at, created_at')
      .single()

    if (insertError) {
      console.error('[POST /api/messages/[id]] Insert error:', insertError)
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
    }

    // Scan message for moderation flags (async, non-blocking)
    try {
      const scanResult = scanMessage(trimmedContent)

      if (scanResult.hasFlags) {
        // Use service role to insert flags (bypasses RLS)
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Insert all flags
        const flagsToInsert = scanResult.flags.map(flag => ({
          conversation_id: conversationId,
          message_id: message.id,
          flag_type: flag.type,
          severity: flag.severity,
          evidence_hash: flag.evidenceHash,
          evidence_meta: flag.evidenceMeta,
          created_by: null // System-generated flag
        }))

        const { error: flagError } = await serviceClient
          .from('message_flags')
          .insert(flagsToInsert)

        if (flagError) {
          // Log but don't fail the message send
          console.error('[POST /api/messages] Flag insert error:', flagError)
        } else if (scanResult.maxSeverity >= 4) {
          // Log high-severity flags for monitoring
          console.warn('[MODERATION] High severity flag detected:', {
            conversationId,
            messageId: message.id,
            severity: scanResult.maxSeverity,
            flagTypes: scanResult.flags.map(f => f.type)
          })
        }
      }
    } catch (scanError) {
      // Log but don't fail the message send
      console.error('[POST /api/messages] Scan error:', scanError)
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('[POST /api/messages/[id]] Exception:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
