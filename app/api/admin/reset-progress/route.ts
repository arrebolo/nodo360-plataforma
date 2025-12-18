import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') {
    return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Soportar ambos formatos: course_id (singular) o course_ids (array)
    const { user_id, course_id, course_ids, delete_certificate, delete_certificates } = body

    // Determinar los cursos a reiniciar
    let coursesToReset: string[] = []
    if (course_ids && Array.isArray(course_ids)) {
      coursesToReset = course_ids
    } else if (course_id) {
      coursesToReset = [course_id]
    }

    // Determinar si eliminar certificados
    const shouldDeleteCertificates = delete_certificates || delete_certificate || false

    if (!user_id || coursesToReset.length === 0) {
      return NextResponse.json({ error: 'user_id y course_id/course_ids son requeridos' }, { status: 400 })
    }

    console.log('🔄 [reset-progress] Reiniciando progreso:', {
      user_id,
      courses: coursesToReset.length,
      delete_certificates: shouldDeleteCertificates
    })

    // Intentar usar la función SQL primero
    const { data: rpcResult, error: rpcError } = await supabase.rpc('reset_course_progress', {
      p_user_id: user_id,
      p_course_id: coursesToReset[0],
      p_delete_certificate: shouldDeleteCertificates
    })

    // Si la función SQL existe y funciona, usarla
    if (!rpcError && rpcResult) {
      console.log('✅ [reset-progress] Función SQL ejecutada:', rpcResult)

      // Si hay más cursos, ejecutar para cada uno
      if (coursesToReset.length > 1) {
        for (let i = 1; i < coursesToReset.length; i++) {
          await supabase.rpc('reset_course_progress', {
            p_user_id: user_id,
            p_course_id: coursesToReset[i],
            p_delete_certificate: shouldDeleteCertificates
          })
        }
      }

      return NextResponse.json({
        success: true,
        deleted_progress: rpcResult.deleted_progress || 0,
        xp_removed: rpcResult.xp_deducted || 0,
        new_xp: rpcResult.new_xp || 0,
        new_level: rpcResult.new_level || 1,
        certificate_deleted: rpcResult.deleted_certificate || false
      })
    }

    // Fallback: ejecutar lógica manual si la función SQL no existe
    console.log('⚠️ [reset-progress] Función SQL no disponible, usando fallback manual')

    let totalDeletedProgress = 0
    let totalXpRemoved = 0
    let certificateDeleted = false

    for (const courseId of coursesToReset) {
      // 1. Obtener lecciones del curso
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, module:module_id!inner(course_id)')
        .eq('module.course_id', courseId)

      if (!lessons || lessons.length === 0) continue

      const lessonIds = lessons.map(l => l.id)

      // 2. Contar lecciones completadas
      const { count: completedCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds)

      const deletedCount = completedCount || 0
      totalDeletedProgress += deletedCount

      // 3. Calcular XP (10 por lección)
      const xpToRemove = deletedCount * 10
      totalXpRemoved += xpToRemove

      // 4. Eliminar progreso
      await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user_id)
        .in('lesson_id', lessonIds)

      // 5. Eliminar xp_events si existe la columna lesson_id
      await supabase
        .from('xp_events')
        .delete()
        .eq('user_id', user_id)
        .in('lesson_id', lessonIds)

      // 6. Eliminar certificado si se pidió
      if (shouldDeleteCertificates) {
        const { count: certCount } = await supabase
          .from('certificates')
          .delete({ count: 'exact' })
          .eq('user_id', user_id)
          .eq('course_id', courseId)

        if (certCount && certCount > 0) {
          certificateDeleted = true
        }
      }

      // 7. Actualizar enrollment
      await supabase
        .from('course_enrollments')
        .update({ progress_percentage: 0, completed_at: null })
        .eq('user_id', user_id)
        .eq('course_id', courseId)
    }

    // 8. Actualizar gamification stats
    let newXp = 0
    let newLevel = 1

    if (totalXpRemoved > 0) {
      const { data: currentStats } = await supabase
        .from('user_gamification_stats')
        .select('total_xp, current_level, lessons_completed')
        .eq('user_id', user_id)
        .single()

      if (currentStats) {
        newXp = Math.max(0, (currentStats.total_xp || 0) - totalXpRemoved)
        const newLessonsCompleted = Math.max(0, (currentStats.lessons_completed || 0) - totalDeletedProgress)
        newLevel = Math.max(1, Math.floor(newXp / 100) + 1)
        const xpToNextLevel = (newLevel * 100) - newXp

        await supabase
          .from('user_gamification_stats')
          .update({
            total_xp: newXp,
            current_level: newLevel,
            lessons_completed: newLessonsCompleted,
            xp_to_next_level: xpToNextLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        console.log(`✅ [reset-progress] Stats actualizados: XP ${currentStats.total_xp} → ${newXp}, Nivel ${newLevel}`)
      }
    }

    return NextResponse.json({
      success: true,
      deleted_progress: totalDeletedProgress,
      xp_removed: totalXpRemoved,
      new_xp: newXp,
      new_level: newLevel,
      certificate_deleted: certificateDeleted
    })

  } catch (error) {
    console.error('❌ [reset-progress] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
