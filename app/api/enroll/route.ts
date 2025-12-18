import { NextRequest, NextResponse } from 'next/server'
import { enrollUserInCourse, unenrollUser } from '@/lib/db/enrollments'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/enroll
 * Inscribe al usuario autenticado en un curso
 * Soporta:
 * - application/json: { courseId: string }
 * - application/x-www-form-urlencoded: courseId=xxx (formularios HTML)
 */
export async function POST(request: NextRequest) {
  console.log('🔍 [API POST /enroll] Iniciando...')

  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API POST /enroll] No autenticado')
      // Si es formulario, redirigir a login
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.json(
        { error: 'Debes iniciar sesión para inscribirte' },
        { status: 401 }
      )
    }

    // 2. Obtener courseId del body (soportar JSON y form-urlencoded)
    const contentType = request.headers.get('content-type') || ''
    let courseId: string | null = null
    let courseSlug: string | null = null

    if (contentType.includes('application/json')) {
      // Petición JSON (fetch)
      const body = await request.json().catch(() => null)
      if (body) {
        courseId = body.courseId || body.course_id || null
        courseSlug = body.courseSlug || body.course_slug || null
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Petición de formulario HTML
      const formData = await request.formData()
      courseId = (formData.get('courseId') as string | null) ||
                 (formData.get('course_id') as string | null)
      courseSlug = (formData.get('courseSlug') as string | null) ||
                   (formData.get('course_slug') as string | null)
    } else {
      // Fallback: intentar formData
      const formData = await request.formData().catch(() => null)
      if (formData) {
        courseId = (formData.get('courseId') as string | null) ||
                   (formData.get('course_id') as string | null)
        courseSlug = (formData.get('courseSlug') as string | null) ||
                     (formData.get('course_slug') as string | null)
      }
    }

    if (!courseId) {
      console.error('❌ [API POST /enroll] courseId faltante')
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      )
    }

    // 3. Validar que el curso existe
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, status')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('❌ [API POST /enroll] Curso no encontrado:', courseId)
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    if (course.status !== 'published') {
      console.error('❌ [API POST /enroll] Curso no publicado')
      return NextResponse.json(
        { error: 'Este curso no está disponible aún' },
        { status: 403 }
      )
    }

    // 4. Inscribir usuario
    const { data, error } = await enrollUserInCourse(user.id, courseId)

    if (error) {
      console.error('❌ [API POST /enroll] Error al inscribir:', error)
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    console.log('✅ [API POST /enroll] Inscripción exitosa')

    // 5. Si es formulario HTML, redirigir al curso
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const redirectUrl = `/cursos/${course.slug}`
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // 6. Si es JSON, devolver respuesta
    return NextResponse.json(
      {
        data,
        message: `¡Te has inscrito exitosamente en "${course.title}"!`,
        courseSlug: course.slug
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ [API POST /enroll] Exception:', error)
    console.error('❌ [API POST /enroll] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/enroll
 * Desinscribe al usuario autenticado de un curso
 * Body: { courseId: string }
 */
export async function DELETE(request: NextRequest) {
  console.log('🔍 [API DELETE /enroll] Iniciando...')

  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API DELETE /enroll] No autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    // 2. Obtener courseId (soportar query params y body)
    const { searchParams } = new URL(request.url)
    let courseId = searchParams.get('courseId') || searchParams.get('course_id')

    if (!courseId) {
      const body = await request.json().catch(() => null)
      if (body) {
        courseId = body.courseId || body.course_id
      }
    }

    if (!courseId) {
      console.error('❌ [API DELETE /enroll] courseId faltante')
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      )
    }

    // 3. Desinscribir usuario
    const { success, error } = await unenrollUser(user.id, courseId)

    if (!success) {
      console.error('❌ [API DELETE /enroll] Error al desinscribir:', error)
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    console.log('✅ [API DELETE /enroll] Desinscripción exitosa')
    return NextResponse.json(
      {
        success: true,
        message: 'Te has desinscrito del curso exitosamente'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [API DELETE /enroll] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
