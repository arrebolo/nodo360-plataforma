import { createClient } from '@/lib/supabase/server'
import { Certificate, CertificateWithDetails } from '@/types/certificates'

// Obtener certificados del usuario
export async function getUserCertificates(userId: string): Promise<CertificateWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      user:user_id (
        full_name,
        email,
        avatar_url
      ),
      course:course_id (
        title,
        slug,
        level,
        thumbnail_url,
        instructor:instructor_id (
          full_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })

  if (error) {
    console.error('❌ [getUserCertificates] Error:', error)
    return []
  }

  return (data || []).map((cert: any) => ({
    ...cert,
    user_name: cert.user?.full_name || 'Usuario',
    user_email: cert.user?.email || '',
    user_avatar: cert.user?.avatar_url || null,
    course_title: cert.course?.title || 'Curso',
    course_slug: cert.course?.slug || '',
    course_level: cert.course?.level || 'beginner',
    course_thumbnail: cert.course?.thumbnail_url || null,
    instructor_name: cert.course?.instructor?.full_name || null,
  })) as CertificateWithDetails[]
}

// Obtener certificado por número (para verificación pública)
export async function getCertificateByNumber(certificateNumber: string): Promise<CertificateWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      user:user_id (
        full_name,
        email,
        avatar_url
      ),
      course:course_id (
        id,
        title,
        slug,
        level,
        thumbnail_url,
        instructor:instructor_id (
          full_name
        )
      )
    `)
    .eq('certificate_number', certificateNumber)
    .single()

  if (error) {
    console.error('❌ [getCertificateByNumber] Error:', error)
    return null
  }

  const cert = data as any
  const courseId = cert.course?.id

  // Obtener total de lecciones del curso
  let totalLessons = cert.metadata?.total_lessons || null

  if (!totalLessons && courseId) {
    // Obtener módulos del curso
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)

      // Contar lecciones de esos módulos
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .in('module_id', moduleIds)

      totalLessons = count || 0
    }
  }

  return {
    ...cert,
    user_name: cert.user?.full_name || 'Usuario',
    user_email: cert.user?.email || '',
    user_avatar: cert.user?.avatar_url || null,
    course_title: cert.course?.title || 'Curso',
    course_slug: cert.course?.slug || '',
    course_level: cert.course?.level || 'beginner',
    course_thumbnail: cert.course?.thumbnail_url || null,
    instructor_name: cert.course?.instructor?.full_name || null,
    metadata: {
      ...cert.metadata,
      total_lessons: totalLessons
    }
  } as CertificateWithDetails
}

// Verificar si usuario ya tiene certificado para un curso
export async function hasCertificate(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  return !!data
}

// Emitir certificado
export async function issueCertificate(
  userId: string,
  courseId: string,
  metadata: Record<string, unknown> = {}
): Promise<Certificate | null> {
  const supabase = await createClient()

  // Verificar que no exista ya
  const exists = await hasCertificate(userId, courseId)
  if (exists) {
    console.log('ℹ️ [issueCertificate] Certificado ya existe')
    return null
  }

  // Generar número único con formato NODO360-YYYY-XXXXXXXX
  const year = new Date().getFullYear()
  const randomId = crypto.randomUUID().slice(0, 8).toUpperCase()
  const certificateNumber = `NODO360-${year}-${randomId}`

  // Obtener título del curso para el certificado
  const courseTitle = (metadata.course_title as string) || 'Curso Completado'
  const title = `Certificado de Finalización: ${courseTitle}`
  const description = `Certificado de finalización del curso ${courseTitle}`

  console.log('📝 [issueCertificate] Creando certificado:', {
    userId,
    courseId,
    certificateNumber,
    title
  })

  // Insertar certificado con campos requeridos
  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      course_id: courseId,
      type: 'course',
      certificate_number: certificateNumber,
      title: title,
      description: description,
      metadata,
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [issueCertificate] Error:', error)
    console.error('❌ [issueCertificate] Detalles:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return null
  }

  console.log('✅ [issueCertificate] Certificado emitido:', certificateNumber)
  return data
}

// Verificar si usuario completó el curso
export async function hasCompletedCourse(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient()

  // Obtener total de lecciones del curso
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, module:module_id!inner(course_id)')
    .eq('module.course_id', courseId)

  if (!lessons || lessons.length === 0) return false

  const lessonIds = lessons.map((l: any) => l.id)

  // Obtener progreso del usuario
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in('lesson_id', lessonIds)

  const completedCount = progress?.length || 0

  return completedCount >= lessonIds.length
}

// Obtener certificado por ID
export async function getCertificateById(certificateId: string): Promise<CertificateWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      user:user_id (
        full_name,
        email,
        avatar_url
      ),
      course:course_id (
        id,
        title,
        slug,
        level,
        thumbnail_url,
        instructor:instructor_id (
          full_name
        )
      )
    `)
    .eq('id', certificateId)
    .single()

  if (error) {
    console.error('❌ [getCertificateById] Error:', error)
    return null
  }

  const cert = data as any
  const courseId = cert.course?.id

  // Obtener total de lecciones del curso
  let totalLessons = cert.metadata?.total_lessons || null

  if (!totalLessons && courseId) {
    // Obtener módulos del curso
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)

      // Contar lecciones de esos módulos
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .in('module_id', moduleIds)

      totalLessons = count || 0
    }
  }

  return {
    ...cert,
    user_name: cert.user?.full_name || 'Usuario',
    user_email: cert.user?.email || '',
    user_avatar: cert.user?.avatar_url || null,
    course_title: cert.course?.title || 'Curso',
    course_slug: cert.course?.slug || '',
    course_level: cert.course?.level || 'beginner',
    course_thumbnail: cert.course?.thumbnail_url || null,
    instructor_name: cert.course?.instructor?.full_name || null,
    metadata: {
      ...cert.metadata,
      total_lessons: totalLessons
    }
  } as CertificateWithDetails
}
