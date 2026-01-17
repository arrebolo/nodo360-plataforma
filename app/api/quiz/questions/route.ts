import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const moduleId = searchParams.get('moduleId')

    // Validar parametros
    if (!courseId && !moduleId) {
      return NextResponse.json(
        { error: 'Se requiere courseId o moduleId' },
        { status: 400 }
      )
    }

    // Verificar autenticacion
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()
    let moduleIds: string[] = []

    if (moduleId) {
      // Preguntas de un modulo especifico
      moduleIds = [moduleId]
    } else if (courseId) {
      // Obtener todos los modulos del curso
      const { data: modules, error: modulesError } = await admin
        .from('modules')
        .select('id')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (modulesError) {
        console.error('[quiz/questions] Error obteniendo modulos:', modulesError)
        return NextResponse.json(
          { error: 'Error obteniendo modulos' },
          { status: 500 }
        )
      }

      moduleIds = (modules || []).map(m => m.id)
    }

    if (moduleIds.length === 0) {
      return NextResponse.json({ questions: [] })
    }

    // Obtener preguntas
    const { data: questions, error: questionsError } = await admin
      .from('quiz_questions')
      .select('id, module_id, question, explanation, options, correct_answer, order_index, difficulty, points')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('[quiz/questions] Error obteniendo preguntas:', questionsError)
      return NextResponse.json(
        { error: 'Error obteniendo preguntas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      questions: questions || [],
      total: questions?.length || 0
    })

  } catch (error) {
    console.error('[quiz/questions] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
