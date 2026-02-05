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
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const unreviewed = searchParams.get('unreviewed') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const offset = (page - 1) * PAGE_SIZE

    // Usar admin client para bypass RLS (cast: tablas no están en tipos generados)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin = createAdminClient() as any

    // Query con filtros
    let query = supabaseAdmin
      .from('message_flags')
      .select('*', { count: 'exact' })

    if (type) {
      query = query.eq('flag_type', type)
    }
    if (severity) {
      query = query.eq('severity', parseInt(severity))
    }
    if (unreviewed) {
      query = query.is('reviewed_at', null)
    }

    const { data: flags, count, error } = await query
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('❌ [Moderation] Error al obtener flags:', error)
      return NextResponse.json({ error: 'Error al obtener flags' }, { status: 500 })
    }

    // Stats
    const { count: totalCount } = await supabaseAdmin
      .from('message_flags')
      .select('*', { count: 'exact', head: true })

    const { count: unreviewedCount } = await supabaseAdmin
      .from('message_flags')
      .select('*', { count: 'exact', head: true })
      .is('reviewed_at', null)

    const { count: highSeverityCount } = await supabaseAdmin
      .from('message_flags')
      .select('*', { count: 'exact', head: true })
      .gte('severity', 4)

    const total = count || 0

    return NextResponse.json({
      flags: flags || [],
      stats: {
        total: totalCount || 0,
        unreviewed: unreviewedCount || 0,
        highSeverity: highSeverityCount || 0,
      },
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    })
  } catch (error) {
    console.error('❌ [Moderation] Error en GET flags:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
