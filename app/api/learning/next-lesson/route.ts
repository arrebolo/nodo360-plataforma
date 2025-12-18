// app/api/learning/next-lesson/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { issueCertificateForCourse } from '@/lib/db/certificates'

export async function POST(request: Request) {
  console.log('🔍 [next-lesson] Iniciando...')

  try {
    const body = (await request.json().catch(() => null)) as
      | { courseSlug?: string; lessonSlug?: string }
      | null

    const courseSlug = body?.courseSlug
    const lessonSlug = body?.lessonSlug

    if (!courseSlug || !lessonSlug) {
      console.error('❌ [next-lesson] Faltan parámetros')
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros: courseSlug o lessonSlug' },
        { status: 400 }
      )
    }

    console.log('🔍 [next-lesson] Curso:', courseSlug, '| Lección:', lessonSlug)

    const supabase = await createClient()

    // 1) Usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ [next-lesson] Usuario no autenticado')
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log('✅ [next-lesson] Usuario:', userId)

    // 2) Curso (id + is_certifiable)
    const { data: courseRow, error: courseError } = await supabase
      .from('courses')
      .select('id, is_certifiable')
      .eq('slug', courseSlug)
      .single()

    if (courseError || !courseRow) {
      console.error('❌ [next-lesson] Curso no encontrado:', courseError?.message)
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // 3) Módulos del curso ordenados
    const { data: moduleRows, error: modulesError } = await supabase
      .from('modules')
      .select('id, order_index')
      .eq('course_id', courseRow.id)
      .order('order_index', { ascending: true })

    if (modulesError || !moduleRows || moduleRows.length === 0) {
      console.error('❌ [next-lesson] Sin módulos:', modulesError?.message)
      return NextResponse.json(
        { success: false, error: 'Sin módulos configurados para este curso' },
        { status: 400 }
      )
    }

    const moduleIds = moduleRows.map((m) => m.id)

    // 4) Todas las lecciones del curso en orden
    const { data: lessonRows, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, slug, module_id, order_index')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    if (lessonsError || !lessonRows || lessonRows.length === 0) {
      console.error('❌ [next-lesson] Sin lecciones:', lessonsError?.message)
      return NextResponse.json(
        { success: false, error: 'Sin lecciones configuradas para este curso' },
        { status: 400 }
      )
    }

    // 5) Ordenar por módulo (order_index) → lección (order_index)
    const sortedLessons = [...lessonRows].sort((a, b) => {
      const ma = moduleRows.find((m) => m.id === a.module_id)
      const mb = moduleRows.find((m) => m.id === b.module_id)
      const modulePosA = ma?.order_index ?? 0
      const modulePosB = mb?.order_index ?? 0
      if (modulePosA !== modulePosB) return modulePosA - modulePosB
      return (a.order_index ?? 0) - (b.order_index ?? 0)
    })

    // 6) Encontrar lección actual
    const currentIndex = sortedLessons.findIndex(
      (l) => l.slug === lessonSlug
    )

    if (currentIndex === -1) {
      console.error('❌ [next-lesson] Lección no encontrada en el curso')
      return NextResponse.json(
        { success: false, error: 'Lección actual no encontrada en el curso' },
        { status: 400 }
      )
    }

    const currentLesson = sortedLessons[currentIndex]
    console.log('✅ [next-lesson] Lección actual:', currentLesson.slug, `(${currentIndex + 1}/${sortedLessons.length})`)

    // 7) Marcar la lección actual como COMPLETADA
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: currentLesson.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )

    if (upsertError) {
      console.error('❌ [next-lesson] Error upsert progreso:', upsertError)
      return NextResponse.json(
        { success: false, error: 'No se pudo actualizar el progreso' },
        { status: 500 }
      )
    }

    console.log('✅ [next-lesson] Progreso guardado para lección:', currentLesson.id)

    // 8) ¿Hay siguiente lección?
    const nextIndex = currentIndex + 1
    if (nextIndex < sortedLessons.length) {
      const nextLesson = sortedLessons[nextIndex]
      const redirectTo = `/cursos/${courseSlug}/${nextLesson.slug}`

      console.log('✅ [next-lesson] Siguiente lección:', nextLesson.slug)

      return NextResponse.json({
        success: true,
        status: 'NEXT_LESSON',
        redirectTo,
      })
    }

    // =========================================
    // 9) ÚLTIMA LECCIÓN → CURSO COMPLETADO
    // =========================================
    console.log('🎉 [next-lesson] ¡Última lección completada!')

    let redirectTo = `/cursos/${courseSlug}`
    let certificateCode: string | null = null

    // Actualizar enrollment como completado
    await supabase
      .from('course_enrollments')
      .update({
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
      })
      .eq('user_id', userId)
      .eq('course_id', courseRow.id)

    // =========================================
    // 10) VERIFICAR QUIZ DEL ÚLTIMO MÓDULO
    // =========================================
    const { data: lastModule, error: lastModuleError } = await supabase
      .from('modules')
      .select('id, title, requires_quiz')
      .eq('course_id', courseRow.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastModuleError) {
      console.error('❌ [next-lesson] Error obteniendo último módulo:', lastModuleError)
    }

    // Si el último módulo requiere quiz, verificar si lo ha aprobado
    if (lastModule?.requires_quiz) {
      console.log('🔍 [next-lesson] Último módulo requiere quiz, verificando...')

      const { data: quizAttempt, error: quizError } = await supabase
        .from('quiz_attempts')
        .select('id, passed, score')
        .eq('module_id', lastModule.id)
        .eq('user_id', userId)
        .eq('passed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (quizError) {
        console.error('❌ [next-lesson] Error verificando quiz:', quizError)
      }

      console.log('🔍 [next-lesson] Estado quiz final:', {
        moduleId: lastModule.id,
        moduleTitle: lastModule.title,
        requiresQuiz: lastModule.requires_quiz,
        quizPassed: !!quizAttempt,
        attemptId: quizAttempt?.id,
        score: quizAttempt?.score
      })

      // Si NO ha aprobado el quiz → redirigir al quiz final
      if (!quizAttempt) {
        console.log('⚠️ [next-lesson] Quiz final pendiente, redirigiendo...')

        return NextResponse.json({
          success: true,
          status: 'NEEDS_FINAL_QUIZ',
          redirectTo: `/cursos/${courseSlug}/quiz-final`,
          message: 'Debes aprobar el quiz final para obtener el certificado',
          moduleId: lastModule.id,
          moduleTitle: lastModule.title,
        })
      }

      console.log('✅ [next-lesson] Quiz final aprobado, procediendo con certificado...')
    }

    // =========================================
    // 11) Si es certificable → emitir certificado
    // =========================================
    if (courseRow.is_certifiable) {
      console.log('🔍 [next-lesson] Curso certificable, emitiendo certificado...')

      const result = await issueCertificateForCourse(userId, courseRow.id)

      if ('error' in result) {
        console.error('❌ [next-lesson] Error emitiendo certificado:', result.error)
      } else {
        certificateCode = result.certificate.certificate_number
        redirectTo = `/certificados/${result.certificate.certificate_number}`
        console.log(
          result.isNew
            ? '🎉 [next-lesson] Nuevo certificado emitido: ' + certificateCode
            : '📜 [next-lesson] Certificado existente recuperado: ' + certificateCode
        )
      }
    } else {
      console.log('ℹ️ [next-lesson] Curso no certificable, volviendo al curso')
    }

    return NextResponse.json({
      success: true,
      status: 'COURSE_COMPLETED',
      redirectTo,
      certificateCode,
    })

  } catch (error) {
    console.error('❌ [next-lesson] Error inesperado:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
