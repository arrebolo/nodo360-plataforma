import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/instructor/referral/stats
 * Obtiene estadísticas de referidos del instructor
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

    // Verificar que es instructor/mentor/admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['instructor', 'mentor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'No tienes permisos de instructor' }, { status: 403 })
    }

    // Obtener estadísticas agregadas
    const { data: stats, error } = await supabase
      .from('instructor_referral_stats')
      .select('*')
      .eq('instructor_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('❌ [referral/stats] Error obteniendo stats:', error)
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
    }

    // Si no hay stats, devolver valores por defecto
    const defaultStats = {
      instructor_id: user.id,
      instructor_name: profile.role,
      total_links: 0,
      active_links: 0,
      total_clicks: 0,
      clicks_last_30_days: 0,
      clicks_last_7_days: 0,
      total_conversions: 0,
      total_enrollments: 0,
      total_purchases: 0,
      conversions_last_30_days: 0,
      total_revenue_cents: 0,
      total_commission_cents: 0,
      revenue_last_30_days_cents: 0,
      commission_last_30_days_cents: 0,
      conversion_rate_percent: 0,
      total_promo_codes: 0,
      active_promo_codes: 0,
      total_promo_uses: 0,
    }

    console.log(`🔍 [referral/stats] Stats obtenidas para instructor ${user.id}`)

    return NextResponse.json({
      success: true,
      stats: stats || defaultStats,
    })
  } catch (error) {
    console.error('❌ [referral/stats] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
