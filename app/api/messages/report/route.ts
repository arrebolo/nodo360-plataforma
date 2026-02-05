import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_REASONS = [
  'spam',
  'external_promo',
  'trading_promo',
  'harassment',
  'scam',
  'inappropriate',
  'other'
] as const

type ReportReason = typeof VALID_REASONS[number]

/**
 * POST /api/messages/report
 * Create a new message report
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, messageId, reportedUserId, reason, details } = body

    // Validaciones básicas
    if (!conversationId || !reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: conversationId, reportedUserId, reason' },
        { status: 400 }
      )
    }

    // Validar razón
    if (!VALID_REASONS.includes(reason as ReportReason)) {
      return NextResponse.json(
        { error: 'Razón de reporte inválida' },
        { status: 400 }
      )
    }

    // No puede reportarse a sí mismo
    if (reportedUserId === user.id) {
      return NextResponse.json(
        { error: 'No puedes reportarte a ti mismo' },
        { status: 400 }
      )
    }

    // Verificar que el usuario es participante de la conversación
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1, participant_2')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    const isParticipant =
      conversation.participant_1 === user.id ||
      conversation.participant_2 === user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'No eres participante de esta conversación' },
        { status: 403 }
      )
    }

    // Verificar que el usuario reportado es el otro participante
    const otherParticipant =
      conversation.participant_1 === user.id
        ? conversation.participant_2
        : conversation.participant_1

    if (reportedUserId !== otherParticipant) {
      return NextResponse.json(
        { error: 'Solo puedes reportar al otro participante de la conversación' },
        { status: 400 }
      )
    }

    // Si hay messageId, verificar que pertenece a la conversación
    if (messageId) {
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id')
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .single()

      if (msgError || !message) {
        return NextResponse.json(
          { error: 'Mensaje no encontrado en esta conversación' },
          { status: 404 }
        )
      }

      // El mensaje debe ser del usuario reportado
      if (message.sender_id !== reportedUserId) {
        return NextResponse.json(
          { error: 'El mensaje no pertenece al usuario reportado' },
          { status: 400 }
        )
      }
    }

    // Sanitizar detalles
    const sanitizedDetails = details
      ? String(details).trim().substring(0, 500)
      : null

    // Crear reporte
    const { data: report, error: insertError } = await supabase
      .from('message_reports')
      .insert({
        conversation_id: conversationId,
        message_id: messageId || null,
        reporter_user_id: user.id,
        reported_user_id: reportedUserId,
        reason,
        details: sanitizedDetails
      })
      .select('id, reason, status, created_at')
      .single()

    if (insertError) {
      // Error de duplicado (ya reportó este mensaje)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya has reportado este mensaje anteriormente' },
          { status: 409 }
        )
      }

      console.error('[POST /api/messages/report] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Error al crear reporte' },
        { status: 500 }
      )
    }

    console.log('[MODERATION] New report created:', {
      reportId: report.id,
      reason,
      reporterId: user.id.substring(0, 8) + '...',
      reportedId: reportedUserId.substring(0, 8) + '...'
    })

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Reporte enviado correctamente. Nuestro equipo lo revisará.'
    })

  } catch (error) {
    console.error('[POST /api/messages/report] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/messages/report
 * Get user's own reports
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: reports, error } = await supabase
      .from('message_reports')
      .select(`
        id,
        reason,
        details,
        status,
        created_at,
        reported_user:reported_user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('reporter_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[GET /api/messages/report] Error:', error)
      return NextResponse.json(
        { error: 'Error al obtener reportes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        limit,
        offset,
        hasMore: (reports?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('[GET /api/messages/report] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
