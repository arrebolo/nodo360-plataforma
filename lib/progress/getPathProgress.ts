import { createClient } from '@/lib/supabase/server'
import { getMiPerfil } from '@/lib/auth/miPerfil'

/**
 * Progreso de la ruta activa de quien tiene la sesion abierta.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ESTADO: hoy NADIE importa esta funcion. Se conserva y se corrige, en lugar de
 * dejarla como estaba, porque tal como estaba escrita no podia funcionar y eso
 * fue lo que hizo diagnosticar mal el problema de las rutas activas: parecia un
 * camino vivo y roto, cuando era un camino muerto.
 *
 * Tres cosas estaban mal, y las tres se arreglan aqui:
 *
 *   1. Leia la ruta activa de `user_selected_paths`, una tabla con 0 filas en
 *      la que NADIE escribe. Donde se guarda de verdad es en
 *      `users.active_path_id`, y ahi escribe /api/user/select-path.
 *
 *   2. Leia los cursos de la ruta de `path_courses`, que es una copia parcial y
 *      antigua: para `web3-basica` tiene 2 filas donde `learning_path_courses`
 *      tiene 5, y para `bitcoin-tecnico` tiene 0 donde la otra tiene 1. La
 *      tabla buena es `learning_path_courses`, que es la que usa el resto del
 *      codigo. Ojo a las columnas, que tambien cambian:
 *          path_courses           -> path_id, order_index
 *          learning_path_courses  -> learning_path_id, position
 *
 *   3. Pedia a `learning_paths` cinco columnas que NO EXISTEN: title,
 *      description, icon, color_from y color_to. Las de verdad son name, emoji
 *      y short_description. Es el mismo fallo que tenia /instructores con
 *      `learning_paths.title` (#231): la consulta falla, el error se descarta y
 *      la pantalla se queda vacia sin que nada avise.
 *
 * La identidad sale de la sesion, no de un parametro: `active_path_id` no es
 * una columna publica desde la 049, asi que se lee con mi_perfil(), que es
 * SECURITY DEFINER y solo devuelve la fila de auth.uid(). Por eso esta funcion
 * ya no recibe userId para la ruta: lo recibe solo para contar su progreso.
 * ────────────────────────────────────────────────────────────────────────────
 */

interface PathProgress {
  path: {
    id: string
    slug: string
    name: string
    shortDescription: string | null
    emoji: string | null
  }
  totalCourses: number
  completedCourses: number
  totalLessons: number
  completedLessons: number
  percentage: number
  nextCourse: {
    id: string
    slug: string
    title: string
  } | null
}

export async function getActivePathProgress(): Promise<PathProgress | null> {
  const supabase = await createClient()

  try {
    // 1. La ruta activa, por mi_perfil()
    const perfil = await getMiPerfil()

    if (!perfil?.active_path_id) {
      return null
    }

    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('id, slug, name, emoji, short_description')
      .eq('id', perfil.active_path_id)
      .maybeSingle()

    if (pathError || !path) {
      console.error('[getActivePathProgress] Error obteniendo la ruta:', pathError?.message)
      return null
    }

    const datosRuta = {
      id: path.id,
      slug: path.slug,
      name: path.name,
      shortDescription: path.short_description ?? null,
      emoji: path.emoji ?? null,
    }

    // 2. Los cursos de la ruta, en orden
    const { data: pathCourses, error: coursesError } = await supabase
      .from('learning_path_courses')
      .select(`
        position,
        is_required,
        courses!inner(
          id,
          slug,
          title
        )
      `)
      .eq('learning_path_id', path.id)
      // Solo los publicados. `fundamentos-bitcoin` lleva un curso archivado en
      // la posicion 90: contarlo bajaria el porcentaje de la ruta por lecciones
      // que ya no se pueden hacer.
      .eq('courses.status', 'published')
      .order('position')

    if (coursesError) {
      console.error('[getActivePathProgress] Error obteniendo los cursos:', coursesError.message)
      return null
    }

    if (!pathCourses || pathCourses.length === 0) {
      return {
        path: datosRuta,
        totalCourses: 0,
        completedCourses: 0,
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        nextCourse: null,
      }
    }

    const userId = perfil.id
    const totalCourses = pathCourses.length
    const courseIds = pathCourses.map((pc) => (pc.courses as unknown as { id: string }).id)

    // 3. En que cursos de la ruta esta matriculado
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', userId)
      .in('course_id', courseIds)

    const enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id) ?? [])

    // 4. Progreso curso a curso
    let totalLessons = 0
    let completedLessons = 0
    let completedCourses = 0
    let nextCourse: { id: string; slug: string; title: string } | null = null

    for (const pathCourse of pathCourses) {
      const course = pathCourse.courses as unknown as { id: string; slug: string; title: string }

      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id)

      const moduleIds = modules?.map((m) => m.id) ?? []
      if (moduleIds.length === 0) continue

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map((l) => l.id) ?? []
      totalLessons += lessonIds.length
      if (lessonIds.length === 0) continue

      const { count: completed } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
        .eq('is_completed', true)

      const hechas = completed ?? 0
      completedLessons += hechas

      const cursoCompleto = hechas === lessonIds.length
      if (cursoCompleto) completedCourses++

      // El siguiente curso es el primero sin matricula o sin terminar
      if (!nextCourse && (!enrolledCourseIds.has(course.id) || !cursoCompleto)) {
        nextCourse = { id: course.id, slug: course.slug, title: course.title }
      }
    }

    const percentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    return {
      path: datosRuta,
      totalCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      percentage,
      nextCourse,
    }
  } catch (error) {
    console.error('[getActivePathProgress] Exception:', error)
    return null
  }
}
