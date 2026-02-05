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
    const { id: reportId } = await params

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

    const body = await request.json()
    const { status, admin_notes } = body

    // Validar status si se proporciona
    if (status) {
      const validStatuses = ['open', 'triaged', 'closed', 'actioned']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
    }

    // Construir update
    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
      // Si se cierra o se toma acción, registrar quién y cuándo
      if (status === 'closed' || status === 'actioned') {
        updateData.resolved_by = user.id
        updateData.resolved_at = new Date().toISOString()
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 })
    }

    // Usar admin client para bypass RLS (cast: tablas no están en tipos generados)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin = createAdminClient() as any

    const { data, error } = await supabaseAdmin
      .from('message_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      console.error('❌ [Moderation] Error al actualizar reporte:', error)
      return NextResponse.json({ error: 'Error al actualizar reporte' }, { status: 500 })
    }

    console.log(`✅ [Moderation] Reporte ${reportId} actualizado por ${user.id}`)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ [Moderation] Error en PATCH reporte:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
