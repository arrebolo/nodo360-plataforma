import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { userId } = await params

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin = createAdminClient() as any

    // Resumen del usuario desde la vista
    const { data: summary } = await supabaseAdmin
      .from('user_incident_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Flags del usuario
    const { data: flags } = await supabaseAdmin
      .from('message_flags')
      .select('*, creator:users!created_by(id, full_name, avatar_url)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    // Reportes contra el usuario
    const { data: reports } = await supabaseAdmin
      .from('message_reports')
      .select(
        `*,
        reporter:users!message_reports_reporter_user_id_fkey(full_name, avatar_url),
        reported_user:users!message_reports_reported_user_id_fkey(full_name, avatar_url)`
      )
      .eq('reported_user_id', userId)
      .order('created_at', { ascending: false })

    // Si no hay summary, construir uno básico
    const fallbackSummary = summary || {
      user_id: userId,
      full_name: null,
      avatar_url: null,
      role: 'student',
      total_flags: (flags || []).length,
      high_severity_flags: 0,
      pending_flags: 0,
      total_reports_received: (reports || []).length,
      open_reports: 0,
      actioned_reports: 0,
      last_flag_at: null,
      last_report_at: null,
      risk_level: 'limpio',
    }

    return NextResponse.json({
      summary: fallbackSummary,
      flags: flags || [],
      reports: reports || [],
    })
  } catch (error) {
    console.error('❌ [Moderation] Error en GET user incidents:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
