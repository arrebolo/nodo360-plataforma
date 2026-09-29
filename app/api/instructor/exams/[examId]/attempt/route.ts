import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * Cuantas preguntas lleva un intento.
 *
 * Quince, y no las 20 de instructor_exams.total_questions: el banco de una
 * especialidad tendra 30 al principio, y con 20 por intento dos intentos
 * compartirian dos tercios de las preguntas. Con 15 salen dos intentos limpios
 * sin repetir ni una.
 */
const PREGUNTAS_POR_INTENTO = 15

/**
 * GET /api/instructor/exams/[examId]/attempt
 * Verifica si el usuario puede intentar el examen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { examId } = await params

    // Llamar a can_attempt_exam
    const { data: canAttempt, error } = await supabase
      .rpc('can_attempt_exam', { p_user_id: user.id, p_exam_id: examId })

    if (error) {
      console.error('[instructor/exams/attempt] ❌ Error verificando elegibilidad:', error)
      return NextResponse.json({ error: 'Error al verificar elegibilidad' }, { status: 500 })
    }

    const result = canAttempt?.[0] ?? null

    console.log(`[instructor/exams/attempt] ✅ Verificación para usuario ${user.id}, examen ${examId}: ${result?.can_attempt ? 'puede' : 'no puede'}`)

    return NextResponse.json({
      success: true,
      exam_id: examId,
      ...result,
    })
  } catch (error) {
    console.error('[instructor/exams/attempt] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/instructor/exams/[examId]/attempt
 * Inicia un nuevo intento de examen
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

    // Verificar elegibilidad primero
    const { data: canAttempt, error: checkError } = await supabase
      .rpc('can_attempt_exam', { p_user_id: user.id, p_exam_id: examId })

    if (checkError) {
      console.error('[instructor/exams/attempt] ❌ Error verificando elegibilidad:', checkError)
      return NextResponse.json({ error: 'Error al verificar elegibilidad' }, { status: 500 })
    }

    const eligibility = canAttempt?.[0]
    if (!eligibility?.can_attempt) {
      return NextResponse.json({
        success: false,
        error: eligibility?.reason || 'No puedes intentar este examen',
        next_available_at: eligibility?.next_available_at,
        models_used: eligibility?.models_used,
        total_models: eligibility?.total_models,
      }, { status: 403 })
    }

    // LAS PREGUNTAS SALEN DEL BANCO, Y LAS SIRVE LA BASE.
    //
    // Antes: select_exam_model() elegia un modelo aleatorio no usado y aqui se
    // leian sus veinte preguntas con .eq('model_id', modelId). Con el banco por
    // especialidad no hay modelo que elegir.
    //
    // servir_preguntas() hace tres cosas en una, y por eso esta en la base y no
    // aqui: crea el intento, elige 15 preguntas que esta persona NO ha visto
    // nunca en este examen, y apunta cuales le tocaron. Si se hiciera en tres
    // pasos desde el servidor, un fallo en el segundo dejaria un intento
    // huerfano que ademas cuenta como visto.
    //
    // Con el cliente de SERVICIO: la funcion exige auth.uid() IS NULL y
    // authenticated no tiene EXECUTE. Si pudiera llamarla el candidato, tendria
    // el banco entero repitiendo llamadas. Y NO devuelve correct_answer.
    const banco = createAdminClient() as unknown as SupabaseClient
    const { data: servidas, error: errorServir } = await banco.rpc('servir_preguntas', {
      p_user_id: user.id,
      p_exam_id: examId,
      p_cuantas: PREGUNTAS_POR_INTENTO,
    })

    if (errorServir) {
      // P0001 es el «no quedan preguntas sin ver suficientes» de la funcion: no
      // es un error del servidor, es que este candidato agoto el banco.
      const agotado = errorServir.code === 'P0001'
      console.error('[instructor/exams/attempt] ❌ Error sirviendo preguntas:', errorServir)
      return NextResponse.json(
        {
          error: agotado
            ? 'Has visto ya casi todas las preguntas del banco de esta especialidad. Hasta que se amplie, no se puede montar un examen completo sin repetirte preguntas.'
            : 'Error al preparar el examen',
        },
        { status: agotado ? 409 : 500 }
      )
    }

    const questions = (servidas ?? []) as Array<{
      attempt_id: string
      question_id: string
      posicion: number
      question: string
      options: unknown
      difficulty: string
      points: number
      category: string | null
    }>

    if (questions.length === 0) {
      return NextResponse.json({ error: 'El banco de esta especialidad esta vacio' }, { status: 409 })
    }

    const attemptId = questions[0].attempt_id

    // Obtener configuración del examen
    const { data: exam } = await supabase
      .from('instructor_exams')
      .select('time_limit_minutes, total_questions, pass_threshold')
      .eq('id', examId)
      .single()

    console.log(`[instructor/exams/attempt] ✅ Intento ${attemptId} iniciado: usuario ${user.id}, examen ${examId}, ${questions.length} preguntas del banco`)

    return NextResponse.json({
      success: true,
      attempt: {
        // attempt_id, y no model_id: el intento ya existe en la base, creado por
        // servir_preguntas. submit corrige contra las preguntas de ESTE intento.
        attempt_id: attemptId,
        exam_id: examId,
        started_at: new Date().toISOString(),
        time_limit_minutes: exam?.time_limit_minutes ?? 30,
        // Las que se han servido de verdad, no el total_questions del examen:
        // ese sigue diciendo 20 y ahora se sirven 15.
        total_questions: questions.length,
        pass_threshold: exam?.pass_threshold ?? 80,
      },
      questions: questions.map((q) => ({
        id: q.question_id,
        question: q.question,
        options: q.options,
        order_index: q.posicion,
        difficulty: q.difficulty,
        points: q.points,
        category: q.category,
      })),
    })
  } catch (error) {
    console.error('[instructor/exams/attempt] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
