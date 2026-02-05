import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Verificar autenticación y que el usuario actual es admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Parsear filtros
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const statusGroup = searchParams.get('status_group') // 'open' | 'closed'
    const reason = searchParams.get('reason')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const offset = (page - 1) * PAGE_SIZE

    // Usar admin client para bypass RLS (cast: tablas no están en tipos generados)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin = createAdminClient() as any

    // Query con filtros y joins para usuarios
    let query = supabaseAdmin
      .from('message_reports')
      .select(
        `*,
        reporter:users!message_reports_reporter_user_id_fkey(full_name, avatar_url),
        reported_user:users!message_reports_reported_user_id_fkey(full_name, avatar_url)`,
        { count: 'exact' }
      )

    if (status) {
      query = query.eq('status', status)
    }
    if (statusGroup === 'open') {
      query = query.in('status', ['open', 'triaged'])
    } else if (statusGroup === 'closed') {
      query = query.in('status', ['closed', 'actioned'])
    }
    if (reason) {
      query = query.eq('reason', reason)
    }

    const { data: reports, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('❌ [Moderation] Error al obtener reportes:', error)
      return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 })
    }

    // Stats
    const { count: totalCount } = await supabaseAdmin
      .from('message_reports')
      .select('*', { count: 'exact', head: true })

    const { count: openCount } = await supabaseAdmin
      .from('message_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    const { count: actionedCount } = await supabaseAdmin
      .from('message_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'actioned')

    const total = count || 0

    return NextResponse.json({
      reports: reports || [],
      stats: {
        total: totalCount || 0,
        open: openCount || 0,
        actioned: actionedCount || 0,
      },
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    })
  } catch (error) {
    console.error('❌ [Moderation] Error en GET reportes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
