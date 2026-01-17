import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

type RouteContext = {
  params: Promise<{ id: string }>
}

const VALID_STATUSES = ['draft', 'published', 'archived', 'coming_soon'] as const
type CourseStatus = typeof VALID_STATUSES[number]

/**
 * PATCH /api/instructor/courses/[id]/status
 * Cambia el estado de un curso (solo el instructor dueño o admin)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: courseId } = await context.params
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener rol del usuario
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Obtener el curso para verificar propiedad
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id, status')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el instructor del curso o es admin
    const isOwner = course.instructor_id === user.id
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este curso' },
        { status: 403 }
      )
    }

    // Obtener el nuevo estado del body
    const body = await request.json()
    const newStatus = body.status as CourseStatus

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Estado invalido. Valores permitidos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Actualizar el estado del curso
    const updateData: { status: CourseStatus; published_at?: string | null } = {
      status: newStatus
    }

    // Si se publica, establecer published_at
    if (newStatus === 'published' && course.status !== 'published') {
      updateData.published_at = new Date().toISOString()
    }

    // Si se despublica, limpiar published_at
    if (newStatus === 'draft' && course.status === 'published') {
      updateData.published_at = null
    }

    const { error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)

    if (updateError) {
      console.error('[Instructor Status API] Error:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el estado del curso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: newStatus
    })
  } catch (error) {
    console.error('[Instructor Status API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
