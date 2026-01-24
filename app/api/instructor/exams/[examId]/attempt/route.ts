import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

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

    // Seleccionar modelo aleatorio
    const { data: modelId, error: modelError } = await supabase
      .rpc('select_exam_model', { p_user_id: user.id, p_exam_id: examId })

    if (modelError || !modelId) {
      console.error('[instructor/exams/attempt] ❌ Error seleccionando modelo:', modelError)
      return NextResponse.json(
        { error: 'Error al seleccionar modelo de examen' },
        { status: 500 }
      )
    }

    // Obtener preguntas del modelo
    const { data: questions, error: questionsError } = await supabase
      .from('instructor_exam_questions')
      .select('id, question, options, order_index, difficulty, points, category')
      .eq('model_id', modelId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('[instructor/exams/attempt] ❌ Error obteniendo preguntas:', questionsError)
      return NextResponse.json(
        { error: 'Error al obtener preguntas del examen' },
        { status: 500 }
      )
    }

    // Obtener configuración del examen
    const { data: exam } = await supabase
      .from('instructor_exams')
      .select('time_limit_minutes, total_questions, pass_threshold')
      .eq('id', examId)
      .single()

    console.log(`[instructor/exams/attempt] ✅ Intento iniciado: usuario ${user.id}, examen ${examId}, modelo ${modelId}, ${questions?.length} preguntas`)

    return NextResponse.json({
      success: true,
      attempt: {
        exam_id: examId,
        model_id: modelId,
        started_at: new Date().toISOString(),
        time_limit_minutes: exam?.time_limit_minutes ?? 30,
        total_questions: exam?.total_questions ?? 20,
        pass_threshold: exam?.pass_threshold ?? 80,
      },
      questions: questions?.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        order_index: q.order_index,
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
