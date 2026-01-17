import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * GET /api/continue?courseSlug=xxx
 *
 * Redirect inteligente para el botón "Continuar" de un curso específico.
 * - Con progreso → última lección visitada
 * - Sin progreso → primera lección del curso
 * - No inscrito → landing del curso
 * - No autenticado → login con redirect
 *
 * Query params:
 * - courseSlug (required): slug del curso
 * - format=json: devuelve JSON en lugar de redirect (debug)
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const courseSlug = searchParams.get('courseSlug')
  const format = searchParams.get('format')
  const isJsonDebug = format === 'json'

  // Validar courseSlug
  if (!courseSlug) {
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, error: 'courseSlug requerido' }, { status: 400 })
    }
    return NextResponse.redirect(new URL('/cursos', request.url))
  }

  const supabase = await createClient()

  // 1) Autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const loginUrl = `/login?redirect=/cursos/${courseSlug}`
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: loginUrl, reason: 'no_auth' })
    }
    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  // 2) Obtener curso por slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title, status')
    .eq('slug', courseSlug)
    .maybeSingle()

  if (courseError || !course) {
    console.error('❌ [API continue] Curso no encontrado:', courseSlug)
    const fallback = `/cursos/${courseSlug}`
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: fallback, reason: 'course_not_found' })
    }
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // Cursos archivados → landing
  if (course.status === 'archived') {
    const fallback = `/cursos/${courseSlug}`
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: fallback, reason: 'course_archived' })
    }
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // 3) Verificar inscripción
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  if (!enrollment) {
    // No inscrito → landing del curso
    const fallback = `/cursos/${courseSlug}`
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: fallback, reason: 'not_enrolled' })
    }
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // 4) Obtener módulos del curso
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  const moduleIds = modules?.map((m) => m.id) ?? []

  if (moduleIds.length === 0) {
    // Curso sin módulos → landing
    const fallback = `/cursos/${courseSlug}`
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: fallback, reason: 'no_modules' })
    }
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // 5) Obtener lecciones de esos módulos
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, slug, module_id')
    .in('module_id', moduleIds)
    .order('order_index', { ascending: true })

  if (!lessons || lessons.length === 0) {
    // Curso sin lecciones → landing
    const fallback = `/cursos/${courseSlug}`
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: fallback, reason: 'no_lessons' })
    }
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  const lessonIds = lessons.map((l) => l.id)

  // 6) Buscar última lección visitada
  const { data: lastProgress } = await supabase
    .from('user_progress')
    .select('lesson_id, updated_at')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let targetLessonSlug: string

  if (lastProgress?.lesson_id) {
    // Tiene progreso → última lección visitada
    const lastLesson = lessons.find((l) => l.id === lastProgress.lesson_id)
    targetLessonSlug = lastLesson?.slug ?? lessons[0].slug
  } else {
    // Sin progreso → primera lección
    targetLessonSlug = lessons[0].slug
  }

  const targetUrl = `/cursos/${courseSlug}/${targetLessonSlug}`

  console.log('✅ [API continue] Redirect:', { courseSlug, targetLessonSlug, targetUrl })

  if (isJsonDebug) {
    return NextResponse.json({
      ok: true,
      redirect: targetUrl,
      data: {
        courseSlug,
        lessonSlug: targetLessonSlug,
        hasProgress: !!lastProgress,
      },
    })
  }

  return NextResponse.redirect(new URL(targetUrl, request.url))
}
