import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/instructor/exams
 * Lista exámenes de certificación disponibles por ruta de aprendizaje
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Autenticación
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener exámenes activos con info de la ruta
    const { data: exams, error: examsError } = await supabase
      .from('instructor_exams')
      .select(`
        id,
        title,
        description,
        slug,
        total_questions,
        pass_threshold,
        time_limit_minutes,
        total_models,
        cooldown_days,
        certification_validity_years,
        learning_path_id,
        learning_paths (
          id,
          title,
          slug,
          icon
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (examsError) {
      console.error('[instructor/exams] ❌ Error obteniendo exámenes:', examsError)
      return NextResponse.json({ error: 'Error al obtener exámenes' }, { status: 500 })
    }

    // Para cada examen, verificar si el usuario puede intentarlo
    const examsWithStatus = await Promise.all(
      (exams || []).map(async (exam) => {
        const { data: canAttempt } = await supabase
          .rpc('can_attempt_exam', { p_user_id: user.id, p_exam_id: exam.id })

        // Verificar si ya tiene certificación activa para esta ruta
        const { data: certification } = await supabase
          .from('instructor_certifications')
          .select('id, status, expires_at, certification_number')
          .eq('user_id', user.id)
          .eq('learning_path_id', exam.learning_path_id)
          .eq('status', 'active')
          .single()

        return {
          ...exam,
          can_attempt: canAttempt?.[0] ?? null,
          active_certification: certification ?? null,
        }
      })
    )

    console.log(`[instructor/exams] ✅ ${examsWithStatus.length} exámenes listados para usuario ${user.id}`)

    return NextResponse.json({
      success: true,
      exams: examsWithStatus,
    })
  } catch (error) {
    console.error('[instructor/exams] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
