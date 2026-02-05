import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: flagId } = await params

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

    const { review_action } = await request.json()

    // Validar acción
    const validActions = ['dismissed', 'warning_sent', 'user_banned']
    if (!validActions.includes(review_action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    // Usar admin client para bypass RLS (cast: tablas no están en tipos generados)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin = createAdminClient() as any

    const { data, error } = await supabaseAdmin
      .from('message_flags')
      .update({
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        review_action,
      })
      .eq('id', flagId)
      .select()
      .single()

    if (error) {
      console.error('❌ [Moderation] Error al actualizar flag:', error)
      return NextResponse.json({ error: 'Error al actualizar flag' }, { status: 500 })
    }

    console.log(`✅ [Moderation] Flag ${flagId} marcado como ${review_action} por ${user.id}`)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ [Moderation] Error en PATCH flag:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
