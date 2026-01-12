import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardXP } from '@/lib/gamification/awardXP'
import { checkAndAwardBadges } from '@/lib/gamification/checkAndAwardBadges'
import { createCertificate } from '@/lib/certificates/createCertificate'

interface SubmitQuizRequest {
  course_id: string
  user_id: string
  score: number
  passed: boolean
  answers: Record<string, number>
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitQuizRequest = await request.json()
    const { course_id, user_id, score, passed, answers } = body

    // Validar campos requeridos
    if (!course_id || !user_id || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Campos requeridos: course_id, user_id, score' },
        { status: 400 }
      )
    }

    // Verificar autenticacion
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== user_id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()

    // Obtener el primer modulo del curso para usar como referencia
    const { data: firstModule, error: moduleError } = await admin
      .from('modules')
      .select('id')
      .eq('course_id', course_id)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    if (moduleError || !firstModule) {
      console.error('[quiz/submit] Error obteniendo modulo:', moduleError)
      return NextResponse.json(
        { error: 'Curso no tiene modulos' },
        { status: 400 }
      )
    }

    // Obtener preguntas del quiz para calcular correctas
    const { data: allModules } = await admin
      .from('modules')
      .select('id')
      .eq('course_id', course_id)

    const moduleIds = (allModules || []).map(m => m.id)

    const { data: questions } = await admin
      .from('quiz_questions')
      .select('id, correct_answer')
      .in('module_id', moduleIds)

    // Calcular respuestas correctas
    let correctAnswers = 0
    const totalQuestions = questions?.length || Object.keys(answers).length

    if (questions && questions.length > 0) {
      questions.forEach((q) => {
        const userAnswer = answers[q.id]
        if (userAnswer !== undefined && userAnswer === q.correct_answer) {
          correctAnswers++
        }
      })
    } else {
      // Si no hay preguntas en BD, usar el score enviado
      correctAnswers = Math.round((score / 100) * totalQuestions)
    }

    // Formatear answers para JSONB
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      question_id: questionId,
      selected_answer: selectedAnswer,
      correct: questions?.find(q => q.id === questionId)?.correct_answer === selectedAnswer
    }))

    // Insertar intento de quiz
    const { data: attempt, error: insertError } = await admin
      .from('quiz_attempts')
      .insert({
        user_id,
        module_id: firstModule.id, // Usamos primer modulo como referencia
        score: Math.round(score),
        total_questions: totalQuestions > 0 ? totalQuestions : 1,
        correct_answers: correctAnswers,
        passed,
        answers: formattedAnswers,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[quiz/submit] Error insertando intento:', insertError)
      return NextResponse.json(
        { error: 'Error guardando resultado del quiz' },
        { status: 500 }
      )
    }

    // Otorgar XP si aprobo
    let xpAwarded = 0
    if (passed) {
      try {
        const xpResult = await awardXP({
          userId: user_id,
          eventType: 'quiz_passed',
          description: `Quiz final aprobado - Curso`,
          context: { courseId: course_id }
        })
        xpAwarded = xpResult.xpAwarded

        // Bonus por puntuacion perfecta
        if (score === 100) {
          const bonusResult = await awardXP({
            userId: user_id,
            eventType: 'perfect_score',
            description: 'Puntuacion perfecta en quiz final',
            context: { courseId: course_id }
          })
          xpAwarded += bonusResult.xpAwarded
        }
      } catch (xpError) {
        // No falla el quiz por error de XP
        console.error('[quiz/submit] Error otorgando XP:', xpError)
      }
    }

    // ========================================
    // NUEVO: Marcar curso completado + Generar certificado
    // ========================================
    let certificate = null

    if (passed) {
      console.log('[quiz/submit] Usuario aprobo, procesando certificado...')

      try {
        // 1. Marcar curso como completado en enrollments
        const { error: enrollmentError } = await admin
          .from('course_enrollments')
          .update({
            completed_at: new Date().toISOString(),
            progress_percentage: 100,
          })
          .eq('user_id', user_id)
          .eq('course_id', course_id)

        if (enrollmentError) {
          console.error('[quiz/submit] Error actualizando enrollment:', enrollmentError.message)
        } else {
          console.log('[quiz/submit] Curso marcado como completado')
        }

        // 2. Generar certificado (idempotente - no duplica si ya existe)
        const certResult = await createCertificate({
          userId: user_id,
          courseId: course_id,
        })

        if (certResult.success && certResult.certificate) {
          certificate = certResult.certificate
          if (certResult.alreadyExists) {
            console.log('[quiz/submit] Certificado ya existia:', certificate.certificate_number)
          } else {
            console.log('[quiz/submit] Certificado creado:', certificate.certificate_number)
          }
        } else if (!certResult.success) {
          console.error('[quiz/submit] Error creando certificado:', certResult.error)
        }
      } catch (certException) {
        // No fallar la request principal por error de certificado
        console.error('[quiz/submit] Exception en certificado:', certException)
      }
    }

    // ========================================
    // NUEVO: Verificar y otorgar badges automáticamente
    // ========================================
    let awardedBadges: Array<{ id: string; slug: string; title: string; xpAwarded: number }> = []
    try {
      // Verificar badges por quiz aprobado
      const quizBadgeResult = await checkAndAwardBadges({
        userId: user_id,
        eventType: 'quiz_passed',
        metadata: { courseId: course_id },
      })
      if (quizBadgeResult.success && quizBadgeResult.awardedBadges.length > 0) {
        awardedBadges = [...quizBadgeResult.awardedBadges]
      }

      // Si pasó el quiz, también verificar badges por curso completado
      if (passed) {
        const courseBadgeResult = await checkAndAwardBadges({
          userId: user_id,
          eventType: 'course_completed',
          metadata: { courseId: course_id },
        })
        if (courseBadgeResult.success && courseBadgeResult.awardedBadges.length > 0) {
          awardedBadges = [...awardedBadges, ...courseBadgeResult.awardedBadges]
        }
      }

      if (awardedBadges.length > 0) {
        console.log('[quiz/submit] Badges otorgados:', awardedBadges.map(b => b.title))
      }
    } catch (badgeError) {
      // No fallar la request principal por error de badges
      console.error('[quiz/submit] Error verificando badges:', badgeError)
    }

    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      score,
      passed,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      xp_awarded: xpAwarded,
      certificate: certificate,
      awarded_badges: awardedBadges,
    })

  } catch (error) {
    console.error('[quiz/submit] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
