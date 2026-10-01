import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { permisoSobreElExamen } from '@/lib/quiz/permiso-del-examen'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * El examen final de un curso: sus preguntas.
 *
 * Las preguntas se guardan por module_id, y esta API trabaja a nivel de curso
 * juntando las de todos sus modulos.
 *
 * QUIEN PUEDE QUE, en lib/quiz/permiso-del-examen.ts. Hasta la 115 esta ruta
 * comprobaba solo el ROL y despues escribia con el cliente de servicio, que salta
 * la RLS: cualquier instructor podia cambiar el examen de cualquier curso de la
 * plataforma, publicados incluidos, mandando el module_id que quisiera en el
 * cuerpo. La ruta se sigue llamando /api/admin/quiz porque la usa tambien el
 * panel de administracion; el nombre no es el permiso.
 */

// GET: List all questions for a course (across all modules)
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId es requerido' }, { status: 400 })
    }

    // Leer el examen de un curso propio se permite aunque este publicado: lo que
    // no se permite es cambiarlo.
    const permiso = await permisoSobreElExamen({ courseId, soloLectura: true })
    if (!permiso.ok) return permiso.respuesta

    const admin = createAdminClient()

    // Get all modules for this course
    const { data: modules, error: modulesError } = await admin
      .from('modules')
      .select('id, title, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('[GET /api/admin/quiz] Error getting modules:', modulesError)
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    if (!modules || modules.length === 0) {
      return NextResponse.json({
        questions: [],
        modules: [],
        message: 'El curso no tiene modulos'
      })
    }

    const moduleIds = modules.map(m => m.id)

    // Get all questions for these modules
    const { data: questions, error: questionsError } = await admin
      .from('quiz_questions')
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('[GET /api/admin/quiz] Error getting questions:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    return NextResponse.json({
      questions: questions || [],
      modules,
      total: questions?.length || 0
    })

  } catch (error) {
    console.error('[GET /api/admin/quiz] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST: Create a new question
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { module_id, question, options, correct_answer, explanation, order_index, difficulty, points } = body

    // Validations
    if (!module_id || !question || !options || correct_answer === undefined) {
      return NextResponse.json({ error: 'Campos requeridos: module_id, question, options, correct_answer' }, { status: 400 })
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'options debe ser un array con al menos 2 elementos' }, { status: 400 })
    }

    if (correct_answer < 0 || correct_answer >= options.length) {
      return NextResponse.json({ error: 'correct_answer debe ser un indice valido' }, { status: 400 })
    }

    // El module_id llega en el cuerpo de la peticion: hay que comprobar a que
    // curso pertenece antes de escribir nada.
    const permiso = await permisoSobreElExamen({ moduleId: module_id })
    if (!permiso.ok) return permiso.respuesta

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('quiz_questions')
      .insert({
        module_id,
        question,
        options,
        correct_answer,
        explanation: explanation || null,
        order_index: order_index || 0,
        difficulty: difficulty || 'medium',
        points: points || 1
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/quiz] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[POST /api/admin/quiz] Question created:', data.id)
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/admin/quiz] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT: Update a question
export async function PUT(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { id, question, options, correct_answer, explanation, order_index, difficulty, points } = body

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const permiso = await permisoSobreElExamen({ questionId: id })
    if (!permiso.ok) return permiso.respuesta

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (question !== undefined) updateData.question = question
    if (options !== undefined) updateData.options = options
    if (correct_answer !== undefined) updateData.correct_answer = correct_answer
    if (explanation !== undefined) updateData.explanation = explanation
    if (order_index !== undefined) updateData.order_index = order_index
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (points !== undefined) updateData.points = points

    const { data, error } = await admin
      .from('quiz_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PUT /api/admin/quiz] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[PUT /api/admin/quiz] Question updated:', id)
    return NextResponse.json({ data })

  } catch (error) {
    console.error('[PUT /api/admin/quiz] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE: Delete a question
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const permiso = await permisoSobreElExamen({ questionId: id })
    if (!permiso.ok) return permiso.respuesta

    const admin = createAdminClient()

    const { error } = await admin
      .from('quiz_questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/admin/quiz] Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[DELETE /api/admin/quiz] Question deleted:', id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[DELETE /api/admin/quiz] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
