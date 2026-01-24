import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

interface VoteRequest {
  vote: 'for' | 'against' | 'abstain'
  comment?: string | null
}

/**
 * POST /api/mentor/applications/[id]/vote
 * Vota en una aplicación de mentor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: applicationId } = await params
    const body: VoteRequest = await request.json()
    const { vote, comment } = body

    // Validar voto
    if (!vote || !['for', 'against', 'abstain'].includes(vote)) {
      return NextResponse.json(
        { error: 'Voto inválido. Debe ser: for, against, o abstain' },
        { status: 400 }
      )
    }

    // Llamar a vote_mentor_application (retorna JSONB)
    const { data: result, error } = await supabase
      .rpc('vote_mentor_application', {
        p_voter_id: user.id,
        p_application_id: applicationId,
        p_vote: vote,
        p_comment: comment?.trim() || null,
      })

    if (error) {
      console.error('[mentor/applications/vote] ❌ Error votando:', error)
      return NextResponse.json({ error: 'Error al registrar el voto' }, { status: 500 })
    }

    if (!result?.success) {
      console.log(`[mentor/applications/vote] ⚠️ Voto rechazado para ${user.id}: ${result?.error}`)
      return NextResponse.json({
        success: false,
        error: result?.error || 'No se pudo registrar el voto',
      }, { status: 400 })
    }

    console.log(`[mentor/applications/vote] ✅ Voto registrado: ${user.id} → ${vote} en ${applicationId}`)

    return NextResponse.json({
      success: true,
      vote: result.vote,
      message: result.message,
    })
  } catch (error) {
    console.error('[mentor/applications/vote] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
