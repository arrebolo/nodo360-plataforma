import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Obtener balance de créditos
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  console.log('🔍 [credits] Obteniendo balance:', user.id)

  // Obtener o crear registro de créditos
  let { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!credits) {
    // Crear registro inicial
    const { data: newCredits } = await supabase
      .from('user_credits')
      .insert({ user_id: user.id, balance: 0 })
      .select()
      .single()

    credits = newCredits
  }

  // Obtener últimas transacciones
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('✅ [credits] Balance:', credits?.balance || 0)
  return NextResponse.json({
    data: {
      ...credits,
      recent_transactions: transactions || []
    }
  })
}
