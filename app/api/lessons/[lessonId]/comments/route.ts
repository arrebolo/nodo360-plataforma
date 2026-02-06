import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getCommentsByLesson, createComment, getLessonCourseInfo } from '@/lib/comments'
import { createInAppNotification } from '@/lib/notifications/broadcast'

/**
 * GET /api/lessons/[lessonId]/comments
 * Lista comentarios de la lección
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { lessonId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Check user role for filtering hidden comments
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = currentUser?.role === 'admin'

    const comments = await getCommentsByLesson(lessonId)

    // Filter hidden comments for non-admins
    const filteredComments = isAdmin
      ? comments
      : comments.filter(c => !c.is_hidden)

    return NextResponse.json({
      success: true,
      data: filteredComments,
    })
  } catch (error) {
    console.error('[GET /api/lessons/[lessonId]/comments] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/lessons/[lessonId]/comments
 * Crear comentario { content }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { lessonId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

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

    // Create the comment
    const result = await createComment(lessonId, user.id, content)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Get course info to notify instructor
    const courseInfo = await getLessonCourseInfo(lessonId)

    if (courseInfo?.instructorId && courseInfo.instructorId !== user.id) {
      // Get commenter name
      const { data: commenter } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const commenterName = commenter?.full_name || 'Un estudiante'

      // Notify instructor (non-blocking)
      createInAppNotification(
        courseInfo.instructorId,
        'lesson_comment_new',
        '💬 Nuevo comentario en tu curso',
        `${commenterName} comentó en la lección "${courseInfo.lessonTitle}"`,
        `/cursos/${courseInfo.courseSlug}`
      ).catch(err => console.error('Error enviando notificación:', err))
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[POST /api/lessons/[lessonId]/comments] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
