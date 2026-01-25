import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

interface SubmitAnswer {
  question_id: string
  selected_option: number
}

interface SubmitRequest {
  model_id: string
  answers: SubmitAnswer[]
  time_spent_seconds: number
  auto_submitted?: boolean
}

/**
 * POST /api/instructor/exams/[examId]/submit
 * Envía las respuestas del examen y calcula el resultado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { examId } = await params
    const body: SubmitRequest = await request.json()
    const { model_id, answers, time_spent_seconds, auto_submitted = false } = body

    if (!model_id || !answers) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el modelo pertenece al examen
    const { data: model, error: modelError } = await supabase
      .from('instructor_exam_models')
      .select('id, exam_id')
      .eq('id', model_id)
      .eq('exam_id', examId)
      .single()

    if (modelError || !model) {
      console.error('[instructor/exams/submit] ❌ Modelo inválido:', modelError)
      return NextResponse.json(
        { error: 'Modelo de examen inválido' },
        { status: 400 }
      )
    }

    // Obtener examen con configuración
    const { data: exam, error: examError } = await supabase
      .from('instructor_exams')
      .select('id, pass_threshold, learning_path_id, certification_validity_years')
      .eq('id', examId)
      .eq('is_active', true)
      .single()

    if (examError || !exam) {
      console.error('[instructor/exams/submit] ❌ Examen no encontrado:', examError)
      return NextResponse.json(
        { error: 'Examen no encontrado' },
        { status: 404 }
      )
    }

    // Obtener preguntas con respuestas correctas
    const { data: questions, error: questionsError } = await supabase
      .from('instructor_exam_questions')
      .select('id, correct_option, points')
      .eq('model_id', model_id)

    if (questionsError || !questions) {
      console.error('[instructor/exams/submit] ❌ Error obteniendo preguntas:', questionsError)
      return NextResponse.json(
        { error: 'Error al obtener preguntas' },
        { status: 500 }
      )
    }

    // Crear mapa de respuestas correctas
    const correctAnswersMap = new Map(
      questions.map(q => [q.id, { correct: q.correct_option, points: q.points || 1 }])
    )

    // Calcular puntuación
    let correctCount = 0
    let totalPoints = 0
    let earnedPoints = 0

    for (const question of questions) {
      totalPoints += question.points || 1
    }

    for (const answer of answers) {
      const correct = correctAnswersMap.get(answer.question_id)
      if (correct && answer.selected_option === correct.correct) {
        correctCount++
        earnedPoints += correct.points
      }
    }

    const totalQuestions = questions.length
    const score = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : 0
    const passed = score >= exam.pass_threshold

    // Crear registro de intento
    const { data: attempt, error: attemptError } = await supabase
      .from('instructor_exam_attempts')
      .insert({
        user_id: user.id,
        exam_id: examId,
        model_id: model_id,
        score,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        passed,
        time_spent_seconds: time_spent_seconds || 0,
        answers_json: answers,
        auto_submitted,
      })
      .select('id')
      .single()

    if (attemptError || !attempt) {
      console.error('[instructor/exams/submit] ❌ Error creando intento:', attemptError)
      return NextResponse.json(
        { error: 'Error al guardar resultado' },
        { status: 500 }
      )
    }

    // Si aprobó, crear certificación
    let certificationId = null
    if (passed && exam.learning_path_id) {
      // Verificar que no existe certificación activa
      const { data: existingCert } = await supabase
        .from('instructor_certifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('learning_path_id', exam.learning_path_id)
        .eq('status', 'active')
        .maybeSingle()

      if (!existingCert) {
        // Generar número de certificación único
        const certNumber = `NODO360-${exam.learning_path_id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

        // Calcular fecha de expiración
        const validityYears = exam.certification_validity_years || 1
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + validityYears)

        const { data: certification, error: certError } = await supabase
          .from('instructor_certifications')
          .insert({
            user_id: user.id,
            learning_path_id: exam.learning_path_id,
            exam_attempt_id: attempt.id,
            certification_number: certNumber,
            status: 'active',
            issued_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .select('id')
          .single()

        if (certError) {
          console.error('[instructor/exams/submit] ⚠️ Error creando certificación:', certError)
          // No fallamos el request, el intento ya está guardado
        } else {
          certificationId = certification?.id
        }
      }
    }

    console.log(`[instructor/exams/submit] ✅ Examen enviado: usuario ${user.id}, examen ${examId}, score ${score}%, ${passed ? 'APROBADO' : 'NO APROBADO'}`)

    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      score,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      passed,
      certification_id: certificationId,
    })
  } catch (error) {
    console.error('[instructor/exams/submit] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
