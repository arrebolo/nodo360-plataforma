import { createClient } from '@/lib/supabase/server'
import type { CourseWithInstructor } from '@/types/database'

/**
 * Cursos publicados que ofrecer a alguien que ha llegado a un curso que no
 * puede ver.
 *
 * Primero busca en las rutas de aprendizaje a las que pertenece ese curso, para
 * que la sugerencia tenga que ver con lo que la persona buscaba. Si ninguna de
 * esas rutas tiene cursos publicados, cae al catalogo general.
 *
 * Solo devuelve cursos con status = 'published': no se sugiere nada que a su
 * vez lleve a otra pagina de "no disponible".
 */

export type CourseSuggestions = {
  courses: CourseWithInstructor[]
  /** Nombre de la ruta de la que salen las sugerencias, o null si vienen del catalogo */
  pathName: string | null
}

const SELECT_CURSO = `
  *,
  instructor:instructor_id (
    id,
    full_name,
    avatar_url
  )
`

export async function getSuggestedPublishedCourses(
  courseId: string,
  limit = 3
): Promise<CourseSuggestions> {
  const supabase = await createClient()

  // 1. Rutas a las que pertenece el curso
  const { data: enlaces } = await supabase
    .from('learning_path_courses')
    .select('learning_path_id, learning_path:learning_path_id (name)')
    .eq('course_id', courseId)

  const pathIds = (enlaces || []).map((e) => e.learning_path_id).filter(Boolean)

  if (pathIds.length > 0) {
    const { data: enRuta } = await supabase
      .from('learning_path_courses')
      .select(`position, course:course_id!inner (${SELECT_CURSO})`)
      .in('learning_path_id', pathIds)
      .eq('course.status', 'published')
      .order('position', { ascending: true })

    const cursos: CourseWithInstructor[] = []
    const vistos = new Set<string>([courseId])

    for (const fila of enRuta || []) {
      const curso = fila.course as unknown as CourseWithInstructor | null
      if (!curso || vistos.has(curso.id)) continue
      vistos.add(curso.id)
      cursos.push(curso)
      if (cursos.length >= limit) break
    }

    if (cursos.length > 0) {
      const primeraRuta = (enlaces || []).find((e) => e.learning_path)
      const nombre =
        (primeraRuta?.learning_path as unknown as { name: string } | null)?.name ?? null
      return { courses: cursos, pathName: nombre }
    }
  }

  // 2. Catalogo general
  const { data: generales } = await supabase
    .from('courses')
    .select(SELECT_CURSO)
    .eq('status', 'published')
    .neq('id', courseId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return {
    courses: (generales || []) as unknown as CourseWithInstructor[],
    pathName: null,
  }
}
