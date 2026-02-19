import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProjectUpdate, deleteProjectUpdate, adminDeleteProjectUpdate } from '@/lib/projects/updates'

/**
 * DELETE /api/projects/[id]/updates/[updateId]
 * Eliminar una actualización (autor o admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id, updateId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const update = await getProjectUpdate(updateId)
    if (!update) {
      return NextResponse.json({ error: 'Actualización no encontrada' }, { status: 404 })
    }

    if (update.project_id !== id) {
      return NextResponse.json({ error: 'Actualización no pertenece a este proyecto' }, { status: 400 })
    }

    // Check if user is author of the update or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const isAdmin = userData?.role === 'admin'

    if (update.author_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const result = isAdmin
      ? await adminDeleteProjectUpdate(updateId)
      : await deleteProjectUpdate(updateId, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]/updates/[updateId]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
