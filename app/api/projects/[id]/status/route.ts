import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject, startProject, completeProject, archiveProject } from '@/lib/projects'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/projects/[id]/status
 * Cambiar estado del proyecto (start, complete, archive)
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

    const body = await request.json()
    const { action } = body

    let result: { success: boolean; error: string | null }

    switch (action) {
      case 'start':
        if (project.status !== 'approved') {
          return NextResponse.json(
            { error: 'Solo puedes iniciar proyectos aprobados' },
            { status: 400 }
          )
        }
        result = await startProject(id)
        break

      case 'complete':
        if (project.status !== 'in_progress') {
          return NextResponse.json(
            { error: 'Solo puedes completar proyectos en progreso' },
            { status: 400 }
          )
        }
        result = await completeProject(id)
        break

      case 'archive':
        if (!['approved', 'in_progress', 'completed'].includes(project.status)) {
          return NextResponse.json(
            { error: 'No puedes archivar el proyecto en su estado actual' },
            { status: 400 }
          )
        }
        result = await archiveProject(id)
        break

      default:
        return NextResponse.json(
          { error: 'Acción inválida. Usa: start, complete, archive' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    revalidatePath('/dashboard/proyectos')
    revalidatePath(`/proyectos/${id}`)

    return NextResponse.json({
      success: true,
      message: `Proyecto ${action === 'start' ? 'iniciado' : action === 'complete' ? 'completado' : 'archivado'}`,
    })
  } catch (error) {
    console.error('[POST /api/projects/[id]/status] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
