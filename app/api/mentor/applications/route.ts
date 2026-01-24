import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mentor/applications
 * Lista aplicaciones de mentor según el rol del usuario:
 * - Usuarios normales: solo sus propias aplicaciones
 * - Mentores: sus propias + las que están en voting
 * - Admins: todas las aplicaciones
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener rol del usuario
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'student'

    // Filtrar por query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    let query = supabase
      .from('mentor_applications')
      .select(`
        id,
        user_id,
        points_at_application,
        motivation,
        experience,
        status,
        decision_method,
        votes_for,
        votes_against,
        votes_abstain,
        total_eligible_voters,
        quorum_met,
        approval_met,
        decided_by,
        decision_reason,
        voting_starts_at,
        voting_ends_at,
        decided_at,
        can_reapply_at,
        created_at,
        users!mentor_applications_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros según rol
    if (userRole === 'admin') {
      // Admins ven todo, opcionalmente filtrar por status
      if (status) {
        query = query.eq('status', status)
      }
    } else if (userRole === 'mentor') {
      // Mentores ven sus propias + las en voting
      if (status) {
        query = query.eq('status', status)
          .or(`user_id.eq.${user.id},status.eq.voting`)
      } else {
        query = query.or(`user_id.eq.${user.id},status.eq.voting`)
      }
    } else {
      // Usuarios normales solo ven las suyas
      query = query.eq('user_id', user.id)
      if (status) {
        query = query.eq('status', status)
      }
    }

    const { data: applications, error, count } = await query

    if (error) {
      console.error('[mentor/applications] ❌ Error obteniendo aplicaciones:', error)
      return NextResponse.json({ error: 'Error al obtener aplicaciones' }, { status: 500 })
    }

    // Para mentores, verificar si ya votaron en cada aplicación en voting
    let applicationsWithVoteStatus = applications || []
    if (userRole === 'mentor') {
      const votingApps = applicationsWithVoteStatus.filter(a => a.status === 'voting')
      if (votingApps.length > 0) {
        const { data: myVotes } = await supabase
          .from('mentor_application_votes')
          .select('application_id')
          .eq('voter_id', user.id)
          .in('application_id', votingApps.map(a => a.id))

        const votedIds = new Set(myVotes?.map(v => v.application_id) || [])
        applicationsWithVoteStatus = applicationsWithVoteStatus.map(app => ({
          ...app,
          has_voted: app.status === 'voting' ? votedIds.has(app.id) : undefined,
        }))
      }
    }

    console.log(`[mentor/applications] ✅ ${applicationsWithVoteStatus.length} aplicaciones listadas para ${userRole} ${user.id}`)

    return NextResponse.json({
      success: true,
      applications: applicationsWithVoteStatus,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('[mentor/applications] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
