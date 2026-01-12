/**
 * Create Certificate in Database
 *
 * Creates a certificate record when a user completes a course.
 * The PDF can be generated on-demand from the stored record.
 */

import { createClient } from '@/lib/supabase/server'

interface CreateCertificateParams {
  userId: string
  courseId: string
}

interface CertificateResult {
  success: boolean
  certificate?: {
    id: string
    certificate_number: string
    issued_at: string
    verification_url: string
  }
  error?: string
  alreadyExists?: boolean
}

/**
 * Generate a unique certificate number
 * Format: NODO-YYYYMMDD-XXXXX
 */
function generateCertificateNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `NODO-${dateStr}-${random}`
}

/**
 * Create a certificate for a completed course
 */
export async function createCertificate({
  userId,
  courseId,
}: CreateCertificateParams): Promise<CertificateResult> {
  const supabase = await createClient()

  try {
    // 1. Check if certificate already exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('id, certificate_number, issued_at, verification_url')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('type', 'course')
      .maybeSingle()

    if (existing) {
      return {
        success: true,
        certificate: existing,
        alreadyExists: true,
      }
    }

    // 2. Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { success: false, error: 'Curso no encontrado' }
    }

    // 3. Verify user has completed the course
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id, completed_at, progress_percentage')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (!enrollment) {
      return { success: false, error: 'Usuario no inscrito en el curso' }
    }

    // Check if course is completed (100% or completed_at set)
    const isCompleted =
      enrollment.completed_at !== null ||
      (enrollment.progress_percentage !== null && enrollment.progress_percentage >= 100)

    if (!isCompleted) {
      return { success: false, error: 'El curso no ha sido completado' }
    }

    // 4. Generate certificate
    const certificateNumber = generateCertificateNumber()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'
    const verificationUrl = `${siteUrl}/verificar/${certificateNumber}`

    const { data: newCert, error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        certificate_number: certificateNumber,
        title: course.title,
        type: 'course',
        verification_url: verificationUrl,
        issued_at: new Date().toISOString(),
      })
      .select('id, certificate_number, issued_at, verification_url')
      .single()

    if (insertError) {
      console.error('[createCertificate] Insert error:', insertError)

      // Handle unique constraint violation (race condition)
      if (insertError.code === '23505') {
        const { data: existingAfterRace } = await supabase
          .from('certificates')
          .select('id, certificate_number, issued_at, verification_url')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('type', 'course')
          .single()

        if (existingAfterRace) {
          return {
            success: true,
            certificate: existingAfterRace,
            alreadyExists: true,
          }
        }
      }

      return { success: false, error: insertError.message }
    }

    // 5. Update enrollment to mark as completed if not already
    if (!enrollment.completed_at) {
      await supabase
        .from('course_enrollments')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', enrollment.id)
    }

    console.log('[createCertificate] Certificate created:', newCert.certificate_number)

    return {
      success: true,
      certificate: newCert,
    }
  } catch (err) {
    console.error('[createCertificate] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}
