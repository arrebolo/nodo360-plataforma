import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject } from '@/lib/projects'
import { getProjectUpdates, createProjectUpdate } from '@/lib/projects/updates'
import { isProjectCollaborator } from '@/lib/projects/collaborators'

/**
 * GET /api/projects/[id]/updates
 * Obtener actualizaciones de un proyecto
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const project = await getProject(id)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Check if public or has access
    const isPublic = project.is_public && ['approved', 'in_progress', 'completed'].includes(project.status)
    const isAuthor = user?.id === project.author_id
    const isCollaborator = user ? await isProjectCollaborator(id, user.id) : false

    // Check admin
    let isAdmin = false
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = userData?.role === 'admin'
    }

    if (!isPublic && !isAuthor && !isCollaborator && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const updates = await getProjectUpdates(id)

    return NextResponse.json({
      success: true,
      data: updates,
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]/updates] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/updates
 * Crear una actualización (autor o colaborador aceptado)
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

    // Check if user is author or accepted collaborator
    const isAuthor = project.author_id === user.id
    const isCollaborator = await isProjectCollaborator(id, user.id)

    if (!isAuthor && !isCollaborator) {
      return NextResponse.json(
        { error: 'Solo el autor o colaboradores pueden publicar actualizaciones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content } = body

    if (!title?.trim() || title.length < 5) {
      return NextResponse.json(
        { error: 'El título debe tener al menos 5 caracteres' },
        { status: 400 }
      )
    }
    if (!content?.trim() || content.length < 20) {
      return NextResponse.json(
        { error: 'El contenido debe tener al menos 20 caracteres' },
        { status: 400 }
      )
    }

    const result = await createProjectUpdate(id, user.id, { title, content })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[POST /api/projects/[id]/updates] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
