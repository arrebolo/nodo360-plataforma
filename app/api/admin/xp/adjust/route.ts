import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardXP } from '@/lib/gamification/awardXP'
import { checkRateLimit } from '@/lib/ratelimit'

type AdjustXPBody = {
  userId: string
  amount: number
  reason: string
}

/**
 * POST /api/admin/xp/adjust
 * Ajusta XP manualmente (admin) usando el motor central awardXP().
 *
 * Body: { userId: string, amount: number, reason: string }
 * - amount puede ser positivo (dar XP) o negativo (quitar XP).
 */
export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // 1) Auth + rol (cliente de sesión)
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: me, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    // 2) Payload + validación
    const body = (await request.json()) as Partial<AdjustXPBody>

    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const amount = typeof body.amount === 'number' ? body.amount : NaN

    if (!userId || !Number.isFinite(amount) || reason.length < 3) {
      return NextResponse.json(
        { error: 'Payload inválido: userId (string), amount (number), reason (>=3 chars)' },
        { status: 400 }
      )
    }

    // 3) Aplicar XP centralizado (permite negativos en admin_adjustment)
    const result = await awardXP({
      userId,
      eventType: 'admin_adjustment',
      amount,
      description: `Ajuste manual: ${reason}`
    })

    return NextResponse.json({
      success: true,
      message: 'XP ajustado correctamente',
      ...result
    })
  } catch (error) {
    console.error('[Admin][XP Adjust] Error:', error)
    return NextResponse.json({ error: 'Error al ajustar XP' }, { status: 500 })
  }
}


