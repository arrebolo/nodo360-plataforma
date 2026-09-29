import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

interface SubmitAnswer {
  question_id: string
  selected_option: number
}

interface SubmitRequest {
  attempt_id: string
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
    const { attempt_id, answers, time_spent_seconds } = body

    if (!attempt_id || !answers) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el modelo pertenece al examen
    // EL INTENTO, y no el modelo. El intento ya existe: lo creo
    // servir_preguntas() cuando la ruta de attempt sirvio las preguntas.
    //
    // Se comprueba que es de ESTA persona, de ESTE examen y que sigue en curso.
    // Sin eso, alguien podria mandar el attempt_id de otro, o reenviar un
    // intento ya corregido para mejorar su nota.
    const { data: intento, error: errorIntento } = await supabase
      .from('instructor_exam_attempts')
      .select('id, user_id, exam_id, status, total_questions')
      .eq('id', attempt_id)
      .maybeSingle()

    if (errorIntento || !intento) {
      return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 })
    }
    if (intento.user_id !== user.id || intento.exam_id !== examId) {
      console.warn(`[instructor/exams/submit] ⛔ ${user.id} intento enviar el intento ${attempt_id}`)
      return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 })
    }
    if (intento.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Este intento ya se envio' },
        { status: 409 }
      )
    }

    // Obtener examen con configuración
    const { data: exam, error: examError } = await supabase
      .from('instructor_exams')
      // learning_path_id y certification_validity_years ya no se piden: los
      // usaba el bloque que emitia la certificacion sola.
      .select('id, pass_threshold')
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

    // Obtener preguntas con respuestas correctas.
    //
    // Con el cliente de SERVICIO (ver la 087) y con el nombre REAL de la
    // columna: aqui decia correct_option, que NO EXISTE. La real es
    // correct_answer. Con ese nombre la consulta fallaba con 42703 y la
    // puntuacion salia 0 para todo el mundo.
    // El casteo es necesario, y es un sintoma: lib/supabase/types.ts esta
    // desfasado -47 entradas para 77 tablas- y NO conoce ninguna tabla
    // instructor_*, asi que el cliente tipado rechaza esta consulta. Es la razon
    // por la que este codigo usaba el cliente de sesion, que va sin tipos.
    // Regenerar los tipos es su propia tarea; aqui se aisla en una linea.
    // LAS PREGUNTAS DE ESTE INTENTO, no las de un modelo. Es la diferencia que
    // importa: corrigiendo contra el banco entero, alguien podria responder a
    // preguntas que no le tocaron y sumarlas.
    const banco = createAdminClient() as unknown as SupabaseClient
    const { data: servidas, error: questionsError } = await banco
      .from('instructor_exam_attempt_questions')
      .select('question_id, instructor_exam_questions ( id, correct_answer, points )')
      .eq('attempt_id', attempt_id)

    const questions = (servidas ?? [])
      .map((f: any) => f.instructor_exam_questions)
      .filter(Boolean) as Array<{ id: string; correct_answer: number; points: number | null }>

    if (questionsError || questions.length === 0) {
      console.error('[instructor/exams/submit] ❌ Error obteniendo preguntas:', questionsError)
      return NextResponse.json(
        { error: 'Error al obtener preguntas' },
        { status: 500 }
      )
    }

    // Crear mapa de respuestas correctas
    const correctAnswersMap = new Map(
      questions.map(q => [q.id, { correct: q.correct_answer, points: q.points || 1 }])
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

    // EL INTENTO SE ACTUALIZA, no se crea: ya existe desde que se sirvieron las
    // preguntas.
    //
    // Y con los nombres REALES de las columnas. El insert que habia aqui
    // escribia `answers_json` y `auto_submitted`, que NO EXISTEN en la tabla:
    // son `answers`, y auto_submitted no esta. Habria fallado con 42703, como el
    // correct_option de la 087 y el exam_attempt_id de la 092. Tercer nombre
    // inventado en el mismo flujo.
    const { error: attemptError } = await supabase
      .from('instructor_exam_attempts')
      .update({
        score,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        passed,
        time_spent_seconds: time_spent_seconds || 0,
        answers,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .eq('status', 'in_progress')

    if (attemptError) {
      console.error('[instructor/exams/submit] ❌ Error guardando el intento:', attemptError)
      return NextResponse.json(
        { error: 'Error al guardar resultado' },
        { status: 500 }
      )
    }
    const attempt = { id: attempt_id }

    // EL EXAMEN MIDE; LA CERTIFICACION LA DECIDE UNA PERSONA.
    //
    // Aqui se emitia sola: si la puntuacion pasaba del umbral, se insertaba una
    // fila en instructor_certifications con status 'active' y se acababa. Eso
    // convierte un test de opcion multiple en la unica barrera para poder
    // enseñar, y es justo lo que el diseño de la fase A decidio cambiar: hay
    // repreguntas y parte practica, y las valora un evaluador.
    //
    // De paso, esto NUNCA funciono: el insert escribia `exam_attempt_id` y la
    // columna se llama `attempt_id`. El error se registraba y se tragaba —«no
    // fallamos el request, el intento ya esta guardado»— asi que nadie se
    // entero de que no se emitia ninguna certificacion. Con cero intentos en
    // la tabla, tampoco habia forma de notarlo.
    //
    // Lo que queda: el intento y su puntuacion, que es lo que el evaluador
    // necesita delante. La certificacion la crea la pantalla del paso 4.
    //
    // Se sigue devolviendo certification_id, siempre null, porque la pantalla
    // de resultado lo lee. Quitar la clave la dejaria con undefined.
    const certificationId = null

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
