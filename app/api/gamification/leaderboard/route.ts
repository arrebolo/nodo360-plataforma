import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gamification/leaderboard
 *
 * Obtiene el leaderboard global ordenado por XP total
 * Retorna top 100 usuarios con sus stats
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const supabase = await createClient()

    // HACE FALTA SESION, y antes no.
    //
    // Esta ruta no comprobaba nada: con la clave anonima devolvia los nombres
    // del top 100. Al pasar la lectura al cliente de servicio —que hace falta
    // porque la 123 deja de dar las fichas de los alumnos a otra sesion— habria
    // quedado la lista ENTERA abierta a cualquiera. Asi que primero la puerta.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // El ranking es de todos los alumnos, no de quien tiene pagina publica, asi
    // que la ficha se lee con el servicio. Quien pregunta ya tiene sesion.
    const servicio = createAdminClient()

    // Obtener top usuarios por XP
    const { data: topUsers, error } = await servicio
      .from('user_gamification_stats')
      .select(`
        user_id,
        total_xp,
        current_level,
        current_streak,
        users!inner (
          id,
          full_name
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
      name: entry.users?.full_name || 'Usuario',
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


