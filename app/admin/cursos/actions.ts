// app/admin/cursos/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Cliente con service_role para bypass de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function deleteCourseAction(courseId: string) {
  console.log('[deleteCourseAction] Iniciando borrado:', courseId)

  try {
    // 1) Verificar autenticacion
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[deleteCourseAction] Usuario no autenticado')
      return { success: false, error: 'No autenticado' }
    }

    // 2) Verificar rol admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      console.error('[deleteCourseAction] Usuario no es admin')
      return { success: false, error: 'No autorizado' }
    }

    // 3) Primero, borrar relaciones dependientes (en orden)

    // 3.1) Borrar progreso de usuarios en lecciones del curso
    const { data: modules } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)

      // Borrar lecciones de esos modulos
      const { data: lessons } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id)

        // Borrar progreso
        await supabaseAdmin
          .from('user_progress')
          .delete()
          .in('lesson_id', lessonIds)

        // Borrar bookmarks
        await supabaseAdmin
          .from('bookmarks')
          .delete()
          .in('lesson_id', lessonIds)

        // Borrar notas
        await supabaseAdmin
          .from('notes')
          .delete()
          .in('lesson_id', lessonIds)

        // Borrar lecciones
        await supabaseAdmin
          .from('lessons')
          .delete()
          .in('module_id', moduleIds)
      }

      // Borrar modulos
      await supabaseAdmin
        .from('modules')
        .delete()
        .eq('course_id', courseId)
    }

    // 3.2) Borrar enrollments
    await supabaseAdmin
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)

    // 3.3) Borrar certificados
    await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('course_id', courseId)

    // 3.4) Borrar relaciones con learning_paths
    await supabaseAdmin
      .from('learning_path_courses')
      .delete()
      .eq('course_id', courseId)

    // 4) Finalmente, borrar el curso
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('[deleteCourseAction] Error al eliminar curso:', error)
      return { success: false, error: error.message }
    }

    console.log('[deleteCourseAction] Curso eliminado correctamente')

    // 5) Revalidar la pagina
    revalidatePath('/admin/cursos')

    return { success: true }

  } catch (err: any) {
    console.error('[deleteCourseAction] Error inesperado:', err)
    return { success: false, error: err.message || 'Error inesperado' }
  }
}
