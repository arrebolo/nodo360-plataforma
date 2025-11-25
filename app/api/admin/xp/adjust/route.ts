import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden ajustar XP' },
        { status: 403 }
      )
    }

    const { userId, amount, reason } = await request.json()

    // Validar datos
    if (!userId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtener o crear stats actuales
    let { data: stats } = await supabase
      .from('user_gamification_stats')
      .select('total_xp, current_level, xp_to_next_level')
      .eq('user_id', userId)
      .maybeSingle()

    if (!stats) {
      // Crear stats si no existen
      const { data: newStats, error: createError } = await supabase
        .from('user_gamification_stats')
        .insert({
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 100,
          current_streak: 0,
          longest_streak: 0
        })
        .select()
        .single()

      if (createError) throw createError
      stats = newStats
    }

    const newXP = Math.max(0, (stats?.total_xp || 0) + amount)

    // Calcular nuevo nivel (simple: cada 100 XP = 1 nivel)
    const newLevel = Math.floor(newXP / 100) + 1
    const xpToNextLevel = (newLevel * 100) - newXP

    // Actualizar XP y nivel
    const { error: updateError } = await supabase
      .from('user_gamification_stats')
      .update({
        total_xp: newXP,
        current_level: newLevel,
        xp_to_next_level: xpToNextLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Registrar evento
    const { error: eventError } = await supabase
      .from('xp_events')
      .insert({
        user_id: userId,
        event_type: 'admin_adjustment',
        xp_amount: amount,
        description: `Ajuste manual: ${reason}`,
        created_at: new Date().toISOString()
      })

    if (eventError) {
      console.error('[Admin] Error al registrar evento XP:', eventError)
      // No throw - el ajuste ya se hizo, solo falla el log
    }

    console.log(
      `✅ [Admin] XP ajustado para usuario ${userId}: ${amount} XP (Nuevo total: ${newXP})`
    )

    return NextResponse.json({ success: true, newXP, newLevel })
  } catch (error) {
    console.error('[Admin] Error al ajustar XP:', error)
    return NextResponse.json(
      { error: 'Error al ajustar XP' },
      { status: 500 }
    )
  }
}
