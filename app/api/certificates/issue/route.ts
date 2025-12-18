import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { issueCertificate, hasCertificate, hasCompletedCourse } from '@/lib/certificates/queries'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { course_id } = body

  if (!course_id) {
    return NextResponse.json({ error: 'course_id es requerido' }, { status: 400 })
  }

  // Verificar si ya tiene certificado
  const alreadyHas = await hasCertificate(user.id, course_id)
  if (alreadyHas) {
    return NextResponse.json({ error: 'Ya tienes un certificado para este curso' }, { status: 400 })
  }

  // Verificar que completó el curso
  const completed = await hasCompletedCourse(user.id, course_id)
  if (!completed) {
    return NextResponse.json({ error: 'Debes completar todas las lecciones del curso' }, { status: 400 })
  }

  // Obtener datos del curso y usuario para metadata
  const { data: courseData } = await supabase
    .from('courses')
    .select(`
      title,
      instructor:instructor_id (
        full_name
      )
    `)
    .eq('id', course_id)
    .single()

  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Contar lecciones del curso
  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('id, module:module_id!inner(course_id)', { count: 'exact', head: true })
    .eq('module.course_id', course_id)

  // Emitir certificado
  const metadata = {
    user_name: userData?.full_name || 'Usuario',
    course_title: courseData?.title || 'Curso',
    instructor_name: (courseData?.instructor as any)?.full_name || null,
    total_lessons: lessonCount || 0,
    completion_date: new Date().toISOString(),
  }

  const certificate = await issueCertificate(user.id, course_id, metadata)

  if (!certificate) {
    return NextResponse.json({ error: 'Error al emitir certificado' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    certificate: {
      id: certificate.id,
      certificate_number: certificate.certificate_number,
      issued_at: certificate.issued_at,
      metadata,
    }
  })
}
