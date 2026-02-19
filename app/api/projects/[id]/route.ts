import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProject, updateProject, deleteProject } from '@/lib/projects'
import { isProjectCollaborator } from '@/lib/projects/collaborators'

/**
 * GET /api/projects/[id]
 * Obtener un proyecto por ID
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

    // Check visibility
    const isPublic = project.is_public && ['approved', 'in_progress', 'completed'].includes(project.status)
    const isAuthor = user?.id === project.author_id
    const isCollaborator = user ? await isProjectCollaborator(id, user.id) : false

    // Check if user has mentor/admin role
    let isMentorOrAdmin = false
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      isMentorOrAdmin = ['mentor', 'admin'].includes(userData?.role || '')
    }

    // Determine if user can view
    const canView = isPublic || isAuthor || isCollaborator || (isMentorOrAdmin && project.status === 'pending_review')

    if (!canView) {
      return NextResponse.json({ error: 'No tienes acceso a este proyecto' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: project,
      permissions: {
        canEdit: isAuthor && ['draft', 'changes_requested', 'approved', 'in_progress'].includes(project.status),
        canDelete: isAuthor && project.status === 'draft',
        canReview: isMentorOrAdmin && project.status === 'pending_review',
        isCollaborator,
      },
    })
  } catch (error) {
    console.error('[GET /api/projects/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]
 * Actualizar un proyecto (solo autor en estados editables)
 */
export async function PATCH(
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

    if (!['draft', 'changes_requested', 'approved', 'in_progress'].includes(project.status)) {
      return NextResponse.json(
        { error: 'No puedes editar el proyecto en su estado actual' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, summary, description, category } = body

    // Validate if provided
    if (title !== undefined && (title.trim().length < 5)) {
      return NextResponse.json(
        { error: 'El título debe tener al menos 5 caracteres' },
        { status: 400 }
      )
    }
    if (summary !== undefined && (summary.trim().length < 20 || summary.length > 300)) {
      return NextResponse.json(
        { error: 'El resumen debe tener entre 20 y 300 caracteres' },
        { status: 400 }
      )
    }
    if (description !== undefined && description.trim().length < 100) {
      return NextResponse.json(
        { error: 'La descripción debe tener al menos 100 caracteres' },
        { status: 400 }
      )
    }
    if (category !== undefined && !['bitcoin', 'lightning', 'defi', 'education', 'tools', 'general'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    const result = await updateProject(id, { title, summary, description, category })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Eliminar un proyecto (solo drafts)
 */
export async function DELETE(
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

    if (project.status !== 'draft') {
      return NextResponse.json(
        { error: 'Solo puedes eliminar proyectos en borrador' },
        { status: 400 }
      )
    }

    const result = await deleteProject(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
