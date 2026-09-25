import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardXP } from '@/lib/gamification/awardXP'
import { checkAndAwardBadges } from '@/lib/gamification/checkAndAwardBadges'
import { createCertificate } from '@/lib/certificates/createCertificate'
import { checkRateLimit } from '@/lib/ratelimit'
import {
  ESPERA_ENTRE_INTENTOS_SEGUNDOS,
  esExamenLegitimo,
} from '@/lib/quiz/sortearExamen'
import { broadcastCourseCompleted } from '@/lib/notifications'
import { sendCourseCompletedEmail } from '@/lib/email/course-completed'
import { sendBadgeEarnedEmail } from '@/lib/email/badge-earned'

// El cliente solo envia el curso y sus respuestas.
// score, passed y user_id se determinan en el servidor: aceptarlos del cuerpo
// permitia emitir certificados sin responder el quiz.
interface SubmitQuizRequest {
  course_id: string
  answers: Record<string, number>
}

// Umbral de aprobado. Vive en el servidor, no en el componente.
const PASS_THRESHOLD = 70

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const body: SubmitQuizRequest = await request.json()
    const { course_id, answers } = body

    // Validar campos requeridos
    if (!course_id || typeof answers !== 'object' || answers === null) {
      return NextResponse.json(
        { error: 'Campos requeridos: course_id, answers' },
        { status: 400 }
      )
    }

    // Verificar autenticacion. El usuario sale de la sesion, nunca del cuerpo.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const user_id = user.id

    const admin = createAdminClient()

    // Modulos del curso, en su orden. El primero se usa como referencia del
    // intento, que es como se ha guardado siempre.
    const { data: allModules, error: moduleError } = await admin
      .from('modules')
      .select('id')
      .eq('course_id', course_id)
      .order('order_index', { ascending: true })

    if (moduleError || !allModules || allModules.length === 0) {
      console.error('[quiz/submit] Error obteniendo modulos:', moduleError)
      return NextResponse.json(
        { error: 'Curso no tiene modulos' },
        { status: 400 }
      )
    }

    const moduleIds = allModules.map(m => m.id)
    const firstModule = allModules[0]

    // Espera corta entre intentos. Los intentos son ilimitados a proposito
    // -bloquear a quien aprende es peor que el agujero-, pero sin ninguna espera
    // el examen se recorre a golpe de boton.
    const desde = new Date(Date.now() - ESPERA_ENTRE_INTENTOS_SEGUNDOS * 1000).toISOString()
    const { data: recientes } = await admin
      .from('quiz_attempts')
      .select('created_at')
      .eq('user_id', user_id)
      .in('module_id', moduleIds)
      .gte('created_at', desde)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recientes && recientes.length > 0) {
      const faltan = Math.max(
        1,
        ESPERA_ENTRE_INTENTOS_SEGUNDOS -
          Math.floor((Date.now() - new Date(recientes[0].created_at).getTime()) / 1000)
      )
      return NextResponse.json(
        { error: 'Espera ' + faltan + ' segundos antes de volver a intentarlo', retry_after: faltan },
        { status: 429 }
      )
    }

    // Se corrige SOLO lo que se ha respondido, porque el examen es un
    // subconjunto sorteado de las preguntas del curso. Los ids llegan del
    // cliente, asi que hay que comprobar que son de este curso y que forman un
    // examen legitimo: ni mas ni menos preguntas, y el reparto por modulo que
    // toca. Sin eso se podria enviar una seleccion a medida.
    const idsRespondidas = Object.keys(answers)

    if (idsRespondidas.length === 0) {
      return NextResponse.json(
        { error: 'No has respondido ninguna pregunta' },
        { status: 400 }
      )
    }

    const { data: questions, error: questionsError } = await admin
      .from('quiz_questions')
      .select('id, module_id, correct_answer, points, options, explanation')
      .in('module_id', moduleIds)
      .in('id', idsRespondidas)

    // Cuantas preguntas tiene cada modulo, para saber que reparto tocaba
    const { data: todasDelCurso } = await admin
      .from('quiz_questions')
      .select('module_id')
      .in('module_id', moduleIds)

    const totalPorModulo = new Map<string, number>()
    for (const q of todasDelCurso || []) {
      totalPorModulo.set(q.module_id, (totalPorModulo.get(q.module_id) ?? 0) + 1)
    }

    if (questionsError) {
      console.error('[quiz/submit] Error obteniendo preguntas:', questionsError)
      return NextResponse.json(
        { error: 'Error al obtener preguntas del quiz' },
        { status: 500 }
      )
    }

    // Sin preguntas en BD no se puede corregir: es un error de configuracion,
    // no un aprobado. Antes se confiaba en el score enviado por el cliente.
    if (!questions || questions.length === 0) {
      console.error('[quiz/submit] Curso sin preguntas de quiz:', course_id)
      return NextResponse.json(
        { error: 'El curso no tiene preguntas de quiz configuradas' },
        { status: 409 }
      )
    }

    // Todos los ids respondidos tienen que ser preguntas de este curso.
    if (questions.length !== idsRespondidas.length) {
      console.error('[quiz/submit] Ids ajenos al curso:', idsRespondidas.length - questions.length)
      return NextResponse.json(
        { error: 'Hay respuestas que no corresponden a este examen' },
        { status: 400 }
      )
    }

    const legitimo = esExamenLegitimo(questions, moduleIds, totalPorModulo)
    if (!legitimo.ok) {
      console.error('[quiz/submit] Examen no legitimo:', legitimo.motivo)
      return NextResponse.json(
        { error: 'Este examen no es valido: ' + legitimo.motivo },
        { status: 400 }
      )
    }

    // Correccion server-side: correct_answer no sale de esta funcion, salvo
    // para las preguntas FALLADAS y solo despues de corregir. Ahi si sale, con
    // su explicacion: es lo que enseña, y hasta ahora no se mostraba nunca.
    const correctAnswersMap = new Map(
      questions.map(q => [q.id, { correct: q.correct_answer, points: q.points || 1 }])
    )

    let correctAnswers = 0
    let earnedPoints = 0
    let totalPoints = 0

    for (const q of questions) {
      const entry = correctAnswersMap.get(q.id)!
      totalPoints += entry.points

      const userAnswer = answers[q.id]
      if (userAnswer !== undefined && userAnswer === entry.correct) {
        correctAnswers++
        earnedPoints += entry.points
      }
    }

    const totalQuestions = questions.length
    const score = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : 0
    const passed = score >= PASS_THRESHOLD

    // Formatear answers para JSONB
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      question_id: questionId,
      selected_answer: selectedAnswer,
      correct: correctAnswersMap.get(questionId)?.correct === selectedAnswer
    }))

    // Insertar intento de quiz
    const { data: attempt, error: insertError } = await admin
      .from('quiz_attempts')
      .insert({
        user_id,
        module_id: firstModule.id, // Usamos primer modulo como referencia
        score,
        total_questions: totalQuestions,
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
    let courseUserData: { email?: string | null; full_name?: string | null } | null = null
    let courseTitle = 'Curso'

    if (passed) {
      console.log('[quiz/submit] Usuario aprobo, procesando certificado...')

      try {
        // Obtener nombre del curso y usuario (necesario para broadcast y email)
        const { data: courseData } = await admin
          .from('courses')
          .select('title')
          .eq('id', course_id)
          .single()

        const { data: userData } = await admin
          .from('users')
          .select('full_name, email')
          .eq('id', user_id)
          .single()

        courseUserData = userData
        courseTitle = courseData?.title || 'Curso'
        const userName = userData?.full_name || userData?.email?.split('@')[0] || 'Usuario'

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

          // 🎉 Broadcast de curso completado
          try {
            await broadcastCourseCompleted(userName, user_id, courseTitle)
            console.log('[quiz/submit] Broadcast de curso completado enviado')
          } catch (broadcastError) {
            console.error('[quiz/submit] Error en broadcast:', broadcastError)
          }
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

            // Enviar email de curso completado (solo para certificados nuevos)
            if (courseUserData?.email) {
              try {
                // Obtener nivel actual del usuario
                const { data: userStats } = await admin
                  .from('user_gamification_stats')
                  .select('current_level')
                  .eq('user_id', user_id)
                  .single()

                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

                const envio = await sendCourseCompletedEmail({
                  to: courseUserData.email,
                  userName: userName,
                  courseName: courseTitle,
                  certificateUrl: `${siteUrl}/certificados/${certificate.id}`,
                  xpEarned: xpAwarded,
                  newLevel: userStats?.current_level,
                })
                if (envio.success) {
                  console.log('✅ [quiz/submit] Email de curso completado enviado')
                } else {
                  console.error('❌ [quiz/submit] Email de curso completado NO enviado:', envio.error)
                }
              } catch (emailError) {
                console.error('[quiz/submit] Error enviando email:', emailError)
              }
            }
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
    let awardedBadges: Array<{ id: string; slug: string; title: string; description?: string | null; rarity?: string | null; xpAwarded: number }> = []
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

        // Enviar email por cada badge importante (rarity: rare, epic, legendary)
        if (courseUserData?.email) {
          const importantBadges = awardedBadges.filter(
            b => ['rare', 'epic', 'legendary'].includes(b.rarity || '')
          )

          const badgeUserName = courseUserData.full_name || courseUserData.email?.split('@')[0] || 'Estudiante'

          for (const badge of importantBadges) {
            try {
              // Mapear rarity a emoji
              const rarityIcons: Record<string, string> = {
                rare: '💎',
                epic: '🌟',
                legendary: '👑',
              }

              const envio = await sendBadgeEarnedEmail({
                to: courseUserData.email,
                userName: badgeUserName,
                badgeName: badge.title,
                badgeDescription: badge.description || 'Has desbloqueado un nuevo logro en Nodo360',
                badgeIcon: rarityIcons[badge.rarity || ''] || '🏆',
              })
              if (envio.success) {
                console.log('✅ [quiz/submit] Email de badge enviado:', badge.title)
              } else {
                console.error('❌ [quiz/submit] Email de badge NO enviado:', badge.title, envio.error)
              }
            } catch (emailError) {
              console.error('[quiz/submit] Error enviando email de badge:', emailError)
            }
          }
        }
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
      // Desglose por pregunta: si se acerto o no. NO incluye la respuesta
      // correcta, solo el veredicto, para que el cliente pinte el resumen.
      results: formattedAnswers.map(a => ({
        question_id: a.question_id,
        correct: a.correct,
      })),
      // Repaso de lo fallado: la respuesta correcta y su explicacion, SOLO de
      // las preguntas falladas y solo una vez corregido el examen. De las
      // acertadas no se manda nada, y de las que no salieron sorteadas tampoco:
      // el banco entero no viaja nunca al navegador.
      fallos: questions
        .filter(q => answers[q.id] !== correctAnswersMap.get(q.id)!.correct)
        .map(q => ({
          question_id: q.id,
          correcta: String((q.options as unknown[])[q.correct_answer] ?? ''),
          explicacion: q.explanation ?? '',
        })),
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
