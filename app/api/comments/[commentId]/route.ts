import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { updateComment, hideComment, markAsAnswer } from '@/lib/comments'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/comments/[commentId]
 * Update comment: edit content, mark as answer, or hide
 * Body options:
 *   { content: string } - edit comment (author only)
 *   { is_answer: boolean } - mark as answer (instructor/mentor/admin only)
 *   { is_hidden: boolean } - hide comment (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { commentId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get user role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = currentUser?.role || 'student'
    const isAdmin = userRole === 'admin'
    const isMentorOrHigher = ['mentor', 'admin', 'council'].includes(userRole)

    const body = await request.json()

    // Handle is_hidden (admin only)
    if ('is_hidden' in body) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Solo administradores pueden ocultar comentarios' },
          { status: 403 }
        )
      }

      if (body.is_hidden === true) {
        const result = await hideComment(commentId)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: 'Comentario ocultado' })
      }

      // Unhide - also admin only
      const adminClient = createAdminClient() as any
      const { error } = await adminClient
        .from('lesson_comments')
        .update({ is_hidden: false })
        .eq('id', commentId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ success: true, message: 'Comentario visible' })
    }

    // Handle is_answer (instructor/mentor/admin)
    if ('is_answer' in body) {
      // Get the comment to find the lesson and course
      const adminClient = createAdminClient() as any
      const { data: comment } = await adminClient
        .from('lesson_comments')
        .select(`
          lesson_id,
          lessons!inner (
            modules!inner (
              courses!inner (
                instructor_id
              )
            )
          )
        `)
        .eq('id', commentId)
        .single()

      if (!comment) {
        return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
      }

      const instructorId = (comment.lessons as any).modules.courses.instructor_id
      const isInstructor = instructorId === user.id

      if (!isInstructor && !isMentorOrHigher) {
        return NextResponse.json(
          { error: 'Solo el instructor, mentores o administradores pueden marcar respuestas' },
          { status: 403 }
        )
      }

      const result = await markAsAnswer(commentId, body.is_answer === true)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: body.is_answer ? 'Marcado como respuesta' : 'Desmarcado como respuesta',
      })
    }

    // Handle content update (author only)
    if ('content' in body) {
      const content = body.content

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'El contenido del comentario es requerido' },
          { status: 400 }
        )
      }

      if (content.length > 2000) {
        return NextResponse.json(
          { error: 'El comentario no puede exceder 2000 caracteres' },
          { status: 400 }
        )
      }

      const result = await updateComment(commentId, user.id, content)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Comentario actualizado' })
    }

    return NextResponse.json(
      { error: 'Parámetro no reconocido' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[PATCH /api/comments/[commentId]] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
