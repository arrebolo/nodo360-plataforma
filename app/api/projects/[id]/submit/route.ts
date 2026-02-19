import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject, submitProjectForReview } from '@/lib/projects'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/projects/[id]/submit
 * Enviar proyecto a revisión
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const project = await getProject(id)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    if (project.author_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!['draft', 'changes_requested'].includes(project.status)) {
      return NextResponse.json(
        { error: 'El proyecto no puede ser enviado a revisión en su estado actual' },
        { status: 400 }
      )
    }

    // Note: No borramos reviews anteriores. El trigger bump_project_review_round()
    // incrementa current_review_round y las nuevas reviews usan la nueva ronda.
    // Las reviews anteriores se mantienen como historial.

    const result = await submitProjectForReview(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Revalidate paths
    revalidatePath('/dashboard/proyectos')
    revalidatePath('/dashboard/mentor/proyectos/pendientes')

    return NextResponse.json({
      success: true,
      message: 'Proyecto enviado a revisión',
    })
  } catch (error) {
    console.error('[POST /api/projects/[id]/submit] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
