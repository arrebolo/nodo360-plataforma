// lib/db/certificates.ts
// Funciones de certificados unificadas - usa tabla 'certificates'

import { createClient } from '@/lib/supabase/server'

/**
 * Genera un número de certificado único
 * Formato: NODO360-YYYY-XXXXXXX
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `NODO360-${year}-${random}`
}

/**
 * Emite un certificado para un usuario que completó un curso.
 * Si ya existe un certificado para ese user+course, lo retorna sin crear uno nuevo.
 */
export async function issueCertificateForCourse(
  userId: string,
  courseId: string
): Promise<{ certificate: any; isNew: boolean } | { error: string }> {
  console.log('🎓 [issueCertificateForCourse] Iniciando...', { userId, courseId })

  try {
    const supabase = await createClient()

    // 1. Buscar si ya existe un certificado para este user + course
    const { data: existing, error: searchError } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (searchError) {
      console.error('❌ [issueCertificateForCourse] Error buscando:', searchError)
      return { error: searchError.message }
    }

    // 2. Si ya existe, retornarlo
    if (existing) {
      console.log('✅ [issueCertificateForCourse] Certificado existente encontrado:', existing.certificate_number)
      return { certificate: existing, isNew: false }
    }

    // 3. Obtener datos del curso para el título
    const { data: courseData } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single()

    const courseTitle = courseData?.title || 'Curso Completado'

    // 4. Si no existe, crear uno nuevo
    const certificateNumber = generateCertificateNumber()
    console.log('🆕 [issueCertificateForCourse] Creando nuevo certificado:', certificateNumber)

    const { data: newCertificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        certificate_number: certificateNumber,
        title: `Certificado de Finalización: ${courseTitle}`,
        description: `Certificado de finalización del curso ${courseTitle}`,
        type: 'course',
        issued_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ [issueCertificateForCourse] Error insertando:', insertError)
      return { error: insertError.message }
    }

    console.log('✅ [issueCertificateForCourse] Certificado creado exitosamente:', newCertificate.id)
    return { certificate: newCertificate, isNew: true }

  } catch (err) {
    console.error('❌ [issueCertificateForCourse] Error inesperado:', err)
    return { error: 'Error inesperado al emitir certificado' }
  }
}

/**
 * Obtiene el certificado de un usuario para un curso específico
 */
export async function getCertificate(
  userId: string,
  courseId: string
): Promise<any | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) {
    console.error('❌ [getCertificate] Error:', error)
    return null
  }

  return data
}

/**
 * Obtiene un certificado por su código/número de verificación.
 * Usado para la página pública de verificación de certificados.
 */
export async function getCertificateByCode(
  code: string
): Promise<{
  id: string
  code: string
  issuedAt: string
  userName: string | null
  userEmail: string | null
  courseTitle: string
  courseSlug: string
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select('id, certificate_number, issued_at, user_id, course_id')
    .eq('certificate_number', code)
    .single()

  if (error || !data) {
    console.error('❌ [getCertificateByCode] No encontrado:', error?.message)
    return null
  }

  // Obtener usuario
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', data.user_id)
    .single()

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('title, slug')
    .eq('id', data.course_id)
    .single()

  if (!course) return null

  return {
    id: data.id,
    code: data.certificate_number,
    issuedAt: data.issued_at,
    userName: userProfile?.full_name || null,
    userEmail: userProfile?.email || null,
    courseTitle: course.title,
    courseSlug: course.slug,
  }
}

/**
 * Lista todos los certificados de un usuario
 */
export async function getUserCertificates(userId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      course:course_id (
        id,
        title,
        slug,
        thumbnail_url
      )
    `)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })

  if (error) {
    console.error('❌ [getUserCertificates] Error:', error)
    return []
  }

  return data ?? []
}
