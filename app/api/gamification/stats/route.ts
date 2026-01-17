import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('[Gamification API] Usuario:', user.id.substring(0, 8) + '...')

    // 1. Obtener stats de gamificación
    const { data: stats, error: statsError } = await supabase
      .from('user_gamification_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (statsError) {
      console.error('[Gamification] Error fetching stats:', statsError)
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      )
    }

    // Si no tiene stats, crear unas por defecto
    if (!stats) {
      console.log('[Gamification] Usuario sin stats, creando...')
      const { data: newStats, error: createError } = await supabase
        .from('user_gamification_stats')
        .insert({
          user_id: user.id,
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 100,
          current_streak: 0,
          longest_streak: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('[Gamification] Error creating stats:', createError)
      } else {
        console.log('[Gamification] Stats creadas exitosamente')
      }

      return NextResponse.json({
        stats: newStats || {
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 100,
          current_streak: 0,
          longest_streak: 0
        },
        badges: [],
        recentActivity: []
      })
    }

    // 2. Obtener badges del usuario (CORREGIDO - sin xp_reward)
    const { data: userBadgesRaw, error: badgesError1 } = await supabase
      .from('user_badges')
      .select('id, badge_id, unlocked_at')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(10)

    if (badgesError1) {
      console.error('[Gamification] Error fetching user_badges:', badgesError1)
    }

    let badges: any[] = []

    if (userBadgesRaw && userBadgesRaw.length > 0) {
      // Obtener información de los badges
      const badgeIds = userBadgesRaw.map(ub => ub.badge_id)
      
      const { data: badgesData, error: badgesError2 } = await supabase
        .from('badges')
        .select('id, slug, title, description, icon, rarity, category')
        .in('id', badgeIds)

      if (badgesError2) {
        console.error('[Gamification] Error fetching badges info:', badgesError2)
      } else if (badgesData) {
        // Combinar los datos
        badges = userBadgesRaw.map(ub => {
          const badgeInfo = badgesData.find(b => b.id === ub.badge_id)
          return {
            id: ub.id,
            unlocked_at: ub.unlocked_at,
            badge: badgeInfo
          }
        }).filter(b => b.badge) // Eliminar badges sin info
      }
    }

    console.log('[Gamification] Badges cargados:', badges.length)

    // 3. Obtener actividad reciente (XP events)
    const { data: recentActivity, error: activityError } = await supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      console.error('[Gamification] Error fetching activity:', activityError)
    }

    console.log('[Gamification] Recent activity:', recentActivity?.length || 0)

    // 4. Retornar datos
    return NextResponse.json({
      stats: {
        total_xp: stats.total_xp || 0,
        current_level: stats.current_level || 1,
        xp_to_next_level: stats.xp_to_next_level || 100,
        total_badges: badges.length,
        current_streak: stats.current_streak || 0,
        longest_streak: stats.longest_streak || 0,
        last_activity_date: stats.last_activity_date
      },
      badges: badges,
      recentActivity: recentActivity || []
    })

  } catch (error) {
    console.error('[Gamification] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

