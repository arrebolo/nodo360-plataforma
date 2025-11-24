import { NextRequest, NextResponse } from 'next/server'
import { enrollUserInCourse, unenrollUser } from '@/lib/db/enrollments'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/enroll
 * Inscribe al usuario autenticado en un curso
 * Body: { courseId: string }
 */
export async function POST(request: NextRequest) {
  console.log('🔍 [API POST /enroll] Iniciando...')

  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API POST /enroll] No autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión para inscribirte' },
        { status: 401 }
      )
    }

    // 2. Obtener courseId del body
    const body = await request.json()
    const { courseId } = body

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
      .select('id, title, status')
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
    return NextResponse.json(
      {
        data,
        message: `¡Te has inscrito exitosamente en "${course.title}"!`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ [API POST /enroll] Exception:', error)
    console.error('❌ [API POST /enroll] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ [API POST /enroll] Error message:', error instanceof Error ? error.message : String(error))
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

    // 2. Obtener courseId del body
    const body = await request.json()
    const { courseId } = body

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
