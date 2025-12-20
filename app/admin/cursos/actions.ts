'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['admin@nodo360.com', 'alberto@nodo360.com']

// Verificar admin
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userRole = user.user_metadata?.role || 'user'
  const isAdmin = userRole === 'admin' || ADMIN_EMAILS.includes(user.email || '')

  if (!isAdmin) return null

  return user
}

export async function deleteCourseAction(courseId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Verificar admin
  const user = await verifyAdmin()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // 2. Crear cliente admin con service_role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔍 [Admin Action] Iniciando borrado de curso:', courseId)

  try {
    // 3. Obtener modulos del curso
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    if (modulesError) {
      console.error('❌ Error obteniendo modulos:', modulesError)
    }

    // 4. Borrar lecciones de los modulos
    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)

      // Borrar progreso de usuario en esas lecciones
      const { data: lessons } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id)

        // Borrar user_progress
        await supabaseAdmin
          .from('user_progress')
          .delete()
          .in('lesson_id', lessonIds)
        console.log('✅ Progreso de usuarios eliminado')

        // Borrar bookmarks
        await supabaseAdmin
          .from('bookmarks')
          .delete()
          .in('lesson_id', lessonIds)
        console.log('✅ Bookmarks eliminados')

        // Borrar notes
        await supabaseAdmin
          .from('notes')
          .delete()
          .in('lesson_id', lessonIds)
        console.log('✅ Notas eliminadas')
      }

      // Borrar lecciones
      const { error: lessonsError } = await supabaseAdmin
        .from('lessons')
        .delete()
        .in('module_id', moduleIds)

      if (lessonsError) {
        console.error('❌ Error borrando lecciones:', lessonsError)
        return { success: false, error: `Error borrando lecciones: ${lessonsError.message}` }
      }
      console.log('✅ Lecciones eliminadas')
    }

    // 5. Borrar modulos
    const { error: deleteModulesError } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('course_id', courseId)

    if (deleteModulesError) {
      console.error('❌ Error borrando modulos:', deleteModulesError)
      return { success: false, error: `Error borrando modulos: ${deleteModulesError.message}` }
    }
    console.log('✅ Modulos eliminados')

    // 6. Borrar relaciones con rutas de aprendizaje
    await supabaseAdmin
      .from('learning_path_courses')
      .delete()
      .eq('course_id', courseId)
    console.log('✅ Relaciones con rutas eliminadas')

    // 7. Borrar inscripciones
    await supabaseAdmin
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)
    console.log('✅ Inscripciones eliminadas')

    // 8. Borrar certificados del curso
    await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('course_id', courseId)
    console.log('✅ Certificados eliminados')

    // 9. Finalmente borrar el curso
    const { error: deleteCourseError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (deleteCourseError) {
      console.error('❌ [Admin Action] Error al eliminar curso:', deleteCourseError)
      return { success: false, error: deleteCourseError.message }
    }

    console.log('✅ [Admin Action] Curso eliminado correctamente:', courseId)

    // 10. Revalidar la pagina
    revalidatePath('/admin/cursos')

    return { success: true }

  } catch (err: any) {
    console.error('❌ [Admin Action] Error inesperado:', err)
    return { success: false, error: err.message || 'Error inesperado' }
  }
}
