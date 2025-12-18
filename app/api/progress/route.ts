import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [progress] Auth error:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos - soporta tanto JSON como FormData
    let lessonId: string | null = null
    let providedCourseId: string | null = null
    let providedCourseSlug: string | null = null
    let forceCheck = false
    let isFormSubmit = false

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // Si es JSON
      const body = await request.json()
      lessonId = body.lessonId || body.lesson_id
      providedCourseId = body.courseId || body.course_id
      providedCourseSlug = body.courseSlug || body.course_slug
      forceCheck = body.forceCheck || false
    } else {
      // Si es form data (formularios HTML)
      isFormSubmit = true
      try {
        const formData = await request.formData()
        lessonId = formData.get('lessonId') as string || formData.get('lesson_id') as string
        providedCourseId = formData.get('courseId') as string || formData.get('course_id') as string
        providedCourseSlug = formData.get('courseSlug') as string || formData.get('course_slug') as string
        forceCheck = formData.get('forceCheck') === 'true'
      } catch {
        // Si falla form data, intentar JSON como fallback
        const body = await request.json()
        lessonId = body.lessonId || body.lesson_id
        providedCourseId = body.courseId || body.course_id
        providedCourseSlug = body.courseSlug || body.course_slug
        forceCheck = body.forceCheck || false
      }
    }

    // Si es forceCheck, solo verificar estado del curso y emitir certificado
    if (forceCheck && (providedCourseId || providedCourseSlug)) {
      console.log('🔍 [progress] forceCheck - Verificando estado del curso...')
      return await handleForceCheck(
        supabase,
        user.id,
        providedCourseId || undefined,
        providedCourseSlug || undefined
      )
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId requerido' }, { status: 400 })
    }

    console.log('🔍 [progress] Guardando progreso:', { userId: user.id, lessonId, providedCourseId })

    // Verificar si ya existe progreso completado
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id, is_completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single()

    const wasAlreadyCompleted = existingProgress?.is_completed === true
    console.log('📋 [progress] Estado actual:', { wasAlreadyCompleted, lessonId })

    // Guardar progreso
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        watch_time_seconds: 0
      }, {
        onConflict: 'user_id,lesson_id'
      })

    if (progressError) {
      console.error('❌ [progress] Error guardando progreso:', progressError)
      return NextResponse.json({ error: 'Error al guardar progreso' }, { status: 500 })
    }

    console.log('✅ [progress] Progreso guardado correctamente')

    // === ACTUALIZAR COURSE_ENROLLMENTS ===
    // Obtener courseId si no fue proporcionado
    let courseId = providedCourseId
    if (!courseId) {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('module:module_id(course_id)')
        .eq('id', lessonId)
        .single()

      courseId = (lessonData?.module as any)?.course_id
    }

    if (courseId) {
      // Recalcular progreso del curso
      const { data: courseModules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)

      if (courseModules && courseModules.length > 0) {
        const moduleIds = courseModules.map(m => m.id)

        const { data: courseLessons } = await supabase
          .from('lessons')
          .select('id')
          .in('module_id', moduleIds)

        const lessonIds = courseLessons?.map(l => l.id) || []
        const totalLessons = lessonIds.length

        const { data: completedLessons } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('lesson_id', lessonIds)

        const completedCount = completedLessons?.length || 0
        const progressPercentage = totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : 0

        // Actualizar course_enrollments
        await supabase
          .from('course_enrollments')
          .upsert({
            user_id: user.id,
            course_id: courseId,
            progress_percentage: progressPercentage,
            completed_at: progressPercentage === 100 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,course_id'
          })

        console.log('📊 [progress] course_enrollments actualizado:', {
          courseId,
          progressPercentage,
          completedCount,
          totalLessons
        })
      }
    }

    // Actualizar XP (solo si no estaba completada antes)
    const xpGained = wasAlreadyCompleted ? 0 : 10
    let newXp = xpGained
    let newLevel = 1

    const { data: currentStats } = await supabase
      .from('user_gamification_stats')
      .select('total_xp, current_level, lessons_completed')
      .eq('user_id', user.id)
      .single()

    // Solo actualizar XP y stats si la lección no estaba completada antes
    if (!wasAlreadyCompleted) {
      if (currentStats) {
        newXp = (currentStats.total_xp || 0) + xpGained
        const newLessonsCompleted = (currentStats.lessons_completed || 0) + 1
        newLevel = Math.max(1, Math.floor(newXp / 100) + 1)

        await supabase
          .from('user_gamification_stats')
          .update({
            total_xp: newXp,
            current_level: newLevel,
            lessons_completed: newLessonsCompleted,
            xp_to_next_level: (newLevel * 100) - newXp,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } else {
        // Crear stats si no existen
        await supabase
          .from('user_gamification_stats')
          .insert({
            user_id: user.id,
            total_xp: xpGained,
            current_level: 1,
            lessons_completed: 1,
            xp_to_next_level: 100 - xpGained
          })
      }

      // Registrar xp_event
      try {
        await supabase
          .from('xp_events')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            xp_amount: xpGained,
            event_type: 'lesson_completed',
            description: 'Lección completada'
          })
      } catch {
        // Ignorar errores silenciosamente
      }
    } else {
      // Si ya estaba completada, obtener stats actuales para la respuesta
      newXp = currentStats?.total_xp || 0
      newLevel = currentStats?.current_level || 1
    }

    // === VERIFICAR Y CREAR CERTIFICADO AUTOMÁTICO ===
    console.log('🔍 [progress] === INICIANDO VERIFICACIÓN DE CERTIFICADO ===')
    let courseCompleted = false
    let certificateIssued = false
    let certificateId: string | null = null
    let certificateNumber: string | null = null
    let courseTitle: string | null = null

    try {
      // 1. Obtener info del curso desde la lección
      const { data: lessonInfo, error: lessonInfoError } = await supabase
        .from('lessons')
        .select(`
          id,
          module:module_id (
            id,
            course:course_id (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .single()

      console.log('📋 [progress] Lesson info:', { lessonInfo, error: lessonInfoError?.message })

      const moduleData = lessonInfo?.module as any
      const courseData = moduleData?.course

      console.log('📋 [progress] Course data:', { moduleData, courseData })

      if (courseData) {
        const courseId = courseData.id
        courseTitle = courseData.title

        // 2. Contar lecciones del curso
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', courseId)

        console.log('📋 [progress] Modules found:', modules?.length || 0)

        if (modules && modules.length > 0) {
          const moduleIds = modules.map(m => m.id)
          console.log('📋 [progress] Module IDs:', moduleIds)

          const { data: allLessons } = await supabase
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds)

          console.log('📋 [progress] All lessons in course:', allLessons?.length || 0)

          if (allLessons && allLessons.length > 0) {
            const lessonIds = allLessons.map(l => l.id)
            const totalLessons = lessonIds.length

            // 3. Contar completadas
            const { data: completed } = await supabase
              .from('user_progress')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_completed', true)
              .in('lesson_id', lessonIds)

            const completedCount = completed?.length || 0

            console.log('📊 [progress] === PROGRESO DEL CURSO ===')
            console.log('📊 [progress] Curso:', courseTitle)
            console.log('📊 [progress] Total lecciones:', totalLessons)
            console.log('📊 [progress] Completadas:', completedCount)
            console.log('📊 [progress] ¿Curso completo?:', completedCount >= totalLessons)

            // 4. Si está completo, verificar quiz final y crear certificado
            if (completedCount >= totalLessons) {
              courseCompleted = true

              // =====================================================
              // VERIFICACIÓN DE QUIZ FINAL ANTES DE CERTIFICADO
              // =====================================================
              console.log('🔍 [progress] Curso completo, verificando quiz final...')

              // Obtener slug del curso
              const { data: courseRow } = await supabase
                .from('courses')
                .select('slug')
                .eq('id', courseId)
                .limit(1)
                .single()

              const courseSlug = courseRow?.slug

              // Obtener el último módulo del curso (order_index más alto)
              const { data: lastModule, error: lastModuleError } = await supabase
                .from('modules')
                .select('id, title, requires_quiz')
                .eq('course_id', courseId)
                .order('order_index', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (lastModuleError) {
                console.error('❌ [progress] Error obteniendo último módulo:', lastModuleError)
              }

              // Si el último módulo requiere quiz, verificar si lo ha aprobado
              if (lastModule?.requires_quiz) {
                const { data: lastAttempt, error: attemptError } = await supabase
                  .from('quiz_attempts')
                  .select('id, passed, score, created_at')
                  .eq('module_id', lastModule.id)
                  .eq('user_id', user.id)
                  .eq('passed', true)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle()

                if (attemptError) {
                  console.error('❌ [progress] Error verificando quiz final:', attemptError)
                }

                const quizPassed = !!lastAttempt

                console.log('🔍 [progress] Estado quiz final:', {
                  moduleId: lastModule.id,
                  moduleTitle: lastModule.title,
                  requiresQuiz: lastModule.requires_quiz,
                  quizPassed,
                  attemptId: lastAttempt?.id
                })

                // Si NO ha aprobado el quiz del último módulo → redirigir
                if (!quizPassed && courseSlug) {
                  console.log('⚠️ [progress] Quiz final pendiente, redirigiendo...')

                  // Si es formulario HTML, redirigir directamente al quiz
                  if (isFormSubmit) {
                    return NextResponse.redirect(
                      new URL(`/cursos/${courseSlug}/quiz-final`, request.url),
                      { status: 303 }
                    )
                  }

                  return NextResponse.json({
                    success: true,
                    status: 'NEEDS_FINAL_QUIZ',
                    message: 'Debes aprobar el quiz final para obtener el certificado',
                    redirectTo: `/cursos/${courseSlug}/quiz-final`,
                    moduleId: lastModule.id,
                    moduleTitle: lastModule.title,
                    xp_gained: xpGained,
                    new_total_xp: newXp,
                    new_level: newLevel,
                    course_completed: true
                  })
                }
              }

              console.log('✅ [progress] Quiz final aprobado (o no requerido), procediendo con certificado...')

              // Verificar si ya existe certificado
              console.log('🔍 [progress] Verificando si ya existe certificado...')
              const { data: existingCert, error: existingCertError } = await supabase
                .from('certificates')
                .select('id, certificate_number')
                .eq('user_id', user.id)
                .eq('course_id', courseId)
                .maybeSingle()

              console.log('📋 [progress] Certificado existente:', { existingCert, error: existingCertError?.message })

              if (!existingCert) {
                console.log('🆕 [progress] No existe certificado, creando uno nuevo...')
                const certNumber = `NODO360-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

                const { data: newCert, error: certError } = await supabase
                  .from('certificates')
                  .insert({
                    user_id: user.id,
                    course_id: courseId,
                    type: 'course',
                    certificate_number: certNumber,
                    title: courseTitle,
                    description: `Certificado de finalización del curso ${courseTitle}`
                  })
                  .select('id, certificate_number, title')
                  .single()

                if (!certError && newCert) {
                  certificateIssued = true
                  certificateId = newCert.id
                  certificateNumber = newCert.certificate_number
                  console.log('🎉 [progress] ¡CERTIFICADO CREADO!', newCert.certificate_number)
                } else if (certError) {
                  console.error('❌ [progress] Error creando certificado:', certError)
                }
              } else {
                certificateId = existingCert.id
                certificateNumber = existingCert.certificate_number
                console.log('ℹ️ [progress] Certificado ya existe:', existingCert.certificate_number)
              }
            }
          }
        }
      }
    } catch (certCheckError) {
      console.error('⚠️ [progress] Error verificando certificado:', certCheckError)
    }

    // Si es un envío de formulario HTML, redirigir de vuelta
    if (isFormSubmit) {
      const referer = request.headers.get('referer') || '/dashboard'
      return NextResponse.redirect(referer, { status: 303 })
    }

    return NextResponse.json({
      success: true,
      xp_gained: xpGained,
      new_total_xp: newXp,
      new_level: newLevel,
      course_completed: courseCompleted,
      certificate_issued: certificateIssued,
      certificate_number: certificateNumber,
      course_title: courseTitle,
      certificate: courseCompleted && certificateNumber ? {
        id: certificateId,
        number: certificateNumber,
        title: courseTitle
      } : null
    })

  } catch (error) {
    console.error('❌ [progress] Error general:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error interno'
    }, { status: 500 })
  }
}

// =====================================================
// FUNCION: handleForceCheck
// Verifica estado del curso y emite certificado si corresponde
// Se usa desde la pagina quiz-final para generar certificado
// =====================================================
async function handleForceCheck(
  supabase: any,
  userId: string,
  courseId?: string,
  courseSlug?: string
) {
  try {
    // Obtener courseId si solo tenemos slug
    let resolvedCourseId = courseId
    let resolvedCourseTitle = ''

    if (!resolvedCourseId && courseSlug) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title')
        .eq('slug', courseSlug)
        .limit(1)
        .single()

      if (courseData) {
        resolvedCourseId = courseData.id
        resolvedCourseTitle = courseData.title
      }
    }

    if (!resolvedCourseId) {
      return NextResponse.json({ error: 'courseId no encontrado' }, { status: 400 })
    }

    // Obtener titulo si no lo tenemos
    if (!resolvedCourseTitle) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', resolvedCourseId)
        .single()
      resolvedCourseTitle = courseData?.title || 'Curso'
    }

    console.log('🔍 [forceCheck] Verificando curso:', { resolvedCourseId, resolvedCourseTitle })

    // Verificar que todas las lecciones estan completas
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', resolvedCourseId)

    if (!modules || modules.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Curso sin modulos'
      })
    }

    const moduleIds = modules.map((m: any) => m.id)

    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id')
      .in('module_id', moduleIds)

    if (!allLessons || allLessons.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Curso sin lecciones'
      })
    }

    const lessonIds = allLessons.map((l: any) => l.id)

    const { data: completed } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('lesson_id', lessonIds)

    const completedCount = completed?.length || 0
    const totalLessons = lessonIds.length
    const courseCompleted = completedCount >= totalLessons

    console.log('📊 [forceCheck] Progreso:', { completedCount, totalLessons, courseCompleted })

    if (!courseCompleted) {
      return NextResponse.json({
        success: true,
        status: 'COURSE_NOT_COMPLETED',
        message: 'El curso no esta completo',
        course_completed: false
      })
    }

    // Verificar quiz del ultimo modulo
    const { data: lastModule } = await supabase
      .from('modules')
      .select('id, title, requires_quiz')
      .eq('course_id', resolvedCourseId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastModule?.requires_quiz) {
      const { data: quizAttempt } = await supabase
        .from('quiz_attempts')
        .select('id, passed')
        .eq('module_id', lastModule.id)
        .eq('user_id', userId)
        .eq('passed', true)
        .limit(1)
        .maybeSingle()

      if (!quizAttempt) {
        return NextResponse.json({
          success: true,
          status: 'NEEDS_FINAL_QUIZ',
          message: 'Quiz final no aprobado',
          course_completed: true
        })
      }
    }

    // Todo OK - Verificar/crear certificado
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('id, certificate_number')
      .eq('user_id', userId)
      .eq('course_id', resolvedCourseId)
      .maybeSingle()

    let certificateId = existingCert?.id
    let certificateNumber = existingCert?.certificate_number

    if (!existingCert) {
      const certNumber = `NODO360-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

      const { data: newCert, error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          course_id: resolvedCourseId,
          type: 'course',
          certificate_number: certNumber,
          title: resolvedCourseTitle,
          description: `Certificado de finalizacion del curso ${resolvedCourseTitle}`
        })
        .select('id, certificate_number')
        .single()

      if (!certError && newCert) {
        certificateId = newCert.id
        certificateNumber = newCert.certificate_number
        console.log('🎉 [forceCheck] Certificado creado:', certificateNumber)
      } else {
        console.error('❌ [forceCheck] Error creando certificado:', certError)
      }
    } else {
      console.log('ℹ️ [forceCheck] Certificado ya existe:', certificateNumber)
    }

    return NextResponse.json({
      success: true,
      status: 'COURSE_COMPLETED',
      course_completed: true,
      certificate_issued: !existingCert,
      certificate_number: certificateNumber,
      certificate_id: certificateId,
      course_title: resolvedCourseTitle
    })

  } catch (error) {
    console.error('❌ [forceCheck] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno'
    }, { status: 500 })
  }
}
