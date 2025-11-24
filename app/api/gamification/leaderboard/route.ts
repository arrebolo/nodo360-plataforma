import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gamification/leaderboard
 *
 * Obtiene el leaderboard global ordenado por XP total
 * Retorna top 100 usuarios con sus stats
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Obtener top usuarios por XP
    const { data: topUsers, error } = await supabase
      .from('user_gamification_stats')
      .select(`
        user_id,
        total_xp,
        current_level,
        current_streak,
        users!inner (
          id,
          full_name,
          email
        )
      `)
      .order('total_xp', { ascending: false })
      .order('current_level', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[Leaderboard] Error fetching leaderboard:', error)
      return NextResponse.json(
        { error: 'Error obteniendo leaderboard' },
        { status: 500 }
      )
    }

    // Formatear datos para el cliente
    const leaderboard = topUsers?.map((entry: any, index: number) => ({
      position: index + 1,
      userId: entry.user_id,
      name: entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Usuario',
      email: entry.users?.email,
      totalXp: entry.total_xp,
      level: entry.current_level,
      currentStreak: entry.current_streak
    })) || []

    return NextResponse.json({
      leaderboard,
      totalUsers: leaderboard.length
    })

  } catch (error) {
    console.error('[Leaderboard] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
