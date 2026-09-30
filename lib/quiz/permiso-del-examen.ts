import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Quien puede tocar el examen final de un curso.
 *
 * EL EXAMEN FINAL son las filas de `quiz_questions` colgadas de los modulos del
 * curso: asi lo lee el alumno en /cursos/[slug]/quiz-final y asi lo corrige
 * lib/quiz/checkCourseQuiz.ts. `course_quizzes` esta PARADA desde la 078 y no la
 * usa nadie.
 *
 * POR QUE EXISTE ESTE FICHERO
 *   /api/admin/quiz comprobaba unicamente el ROL —admin, instructor o mentor— y
 *   despues escribia con el cliente de servicio, que salta la RLS. Ni una de las
 *   cuatro operaciones miraba de quien es el curso ni si estaba publicado, y el
 *   module_id entraba tal cual desde el cuerpo de la peticion. Es decir: cualquier
 *   instructor podia añadir, cambiar o borrar preguntas del examen de CUALQUIER
 *   curso de la plataforma, publicados incluidos.
 *
 *   La RLS si acotaba eso (medido: INSERT en el curso de otro da 42501, y el
 *   UPDATE ajeno afecta a cero filas), pero la RLS no se aplica al cliente de
 *   servicio. De ahi que hagan falta las dos mitades: esta comprobacion para la
 *   via de la API, y el trigger de la 115 para la via de PostgREST, que es
 *   alcanzable directamente con la clave anon.
 *
 * LAS REGLAS
 *   admin       cualquier curso, publicado o no.
 *   mentor      cualquier curso, pero NO uno publicado: revisa antes de publicar.
 *   instructor  solo SUS cursos (courses.instructor_id), y NO si estan publicados.
 *
 *   Leer es distinto de escribir: el autor de un curso publicado puede seguir
 *   viendo su examen, solo no cambiarlo. Para eso esta `soloLectura`.
 *
 *   «Publicado» es published_at IS NOT NULL —se ha publicado alguna vez— y no
 *   status = 'published', por lo mismo que la 114: cambiar la descripcion manda el
 *   curso a pending_review, y si la condicion fuera el estado se podria editar el
 *   examen mientras esta ahi.
 */

const ROLES_CON_ACCESO = ['admin', 'instructor', 'mentor'] as const

export type PermisoExamen =
  | { ok: true; userId: string; rol: string; courseId: string; publicado: boolean }
  | { ok: false; respuesta: NextResponse }

function no(mensaje: string, estado: number): PermisoExamen {
  return { ok: false, respuesta: NextResponse.json({ error: mensaje }, { status: estado }) }
}

/**
 * Resuelve el curso a partir de lo que traiga la peticion —el curso, un modulo o
 * una pregunta— y decide si quien llama puede tocarlo.
 */
export async function permisoSobreElExamen(que: {
  courseId?: string | null
  moduleId?: string | null
  questionId?: string | null
  soloLectura?: boolean
}): Promise<PermisoExamen> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return no('No autorizado', 401)

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const rol = profile?.role as string | undefined
  if (!rol || !ROLES_CON_ACCESO.includes(rol as (typeof ROLES_CON_ACCESO)[number])) {
    return no('Acceso denegado', 403)
  }

  const admin = createAdminClient()

  // El curso, venga como venga. La pregunta y el modulo se resuelven con el
  // cliente de servicio a proposito: hace falta saber de quien es el curso
  // ANTES de decidir, y para eso hay que poder leerlo.
  let courseId = que.courseId ?? null

  if (!courseId && que.questionId) {
    const { data } = await admin
      .from('quiz_questions')
      .select('module_id')
      .eq('id', que.questionId)
      .maybeSingle()
    if (!data) return no('La pregunta no existe', 404)
    que = { ...que, moduleId: data.module_id }
  }

  if (!courseId && que.moduleId) {
    const { data } = await admin
      .from('modules')
      .select('course_id')
      .eq('id', que.moduleId)
      .maybeSingle()
    if (!data) return no('El modulo no existe', 404)
    courseId = data.course_id
  }

  if (!courseId) return no('Falta el curso, el modulo o la pregunta', 400)

  const { data: curso } = await admin
    .from('courses')
    .select('id, instructor_id, published_at, title')
    .eq('id', courseId)
    .maybeSingle()

  if (!curso) return no('El curso no existe', 404)

  const publicado = curso.published_at !== null
  const esSuyo = curso.instructor_id === user.id

  if (rol === 'instructor' && !esSuyo) {
    return no('Este curso no es tuyo: su examen lo hace su autor.', 403)
  }

  if (publicado && rol !== 'admin' && !que.soloLectura) {
    return no(
      'El examen de un curso ya publicado no se cambia desde aquí: hay alumnos a los que se está corrigiendo con él. Pídelo a la administración.',
      403
    )
  }

  return { ok: true, userId: user.id, rol, courseId, publicado }
}
