'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  extractCourseFromFormData,
  validateCourseData,
  type CourseFormData,
} from './course-utils'

export interface ActionResult {
  success: boolean
  error?: string
  courseId?: string
}

/** Rol que puede tener un curso a su nombre. */
const ROLES_QUE_ENSENAN = ['instructor', 'mentor', 'admin'] as const

type QuienLlama = { userId: string; rol: string; esAdmin: boolean; puedeCrear: boolean }

/**
 * Quien llama, resuelto en el servidor y no por quien llama.
 *
 * Este modulo lleva 'use server' arriba, asi que CADA funcion exportada es un
 * endpoint HTTP publico, identificado por un id que viaja en el bundle del
 * cliente. Que la pagina que las usa este detras de requireAdmin() no protege
 * a la funcion: se puede invocar sin pasar por la pagina.
 *
 * Hasta la 088 ninguna de las tres comprobaba nada, y createCourse ademas
 * aceptaba `instructorId` de quien llamaba y `status` del formulario. Con eso,
 * un student podia crear un curso, y ponerlo publicado de entrada.
 */
async function quienLlama(): Promise<QuienLlama | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const rol = perfil?.role ?? 'student'
  return {
    userId: user.id,
    rol,
    esAdmin: rol === 'admin',
    puedeCrear: (ROLES_QUE_ENSENAN as readonly string[]).includes(rol),
  }
}

/** El curso es suyo, o es administracion. */
async function puedeTocarElCurso(courseId: string, quien: QuienLlama): Promise<boolean> {
  if (quien.esAdmin) return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single()
  return data?.instructor_id === quien.userId
}

/**
 * Create a new course
 */
export async function createCourse(
  formData: FormData,
  options: {
    instructorId: string
    redirectTo?: string
    revalidatePaths?: string[]
  }
): Promise<ActionResult> {
  const quien = await quienLlama()
  if (!quien) return { success: false, error: 'No autorizado' }
  if (!quien.puedeCrear) {
    console.warn(`⛔ [Create Course] Rol ${quien.rol} intento crear un curso`)
    return { success: false, error: 'Solo los instructores y la administracion pueden crear cursos' }
  }

  const supabase = await createClient()
  const data = extractCourseFromFormData(formData)

  // Validate
  const validation = validateCourseData(data)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { success: false, error: firstError }
  }

  // La identidad NO la elige quien llama. Solo la administracion puede poner un
  // curso a nombre de otra persona; un instructor, solo a su nombre.
  const instructorId = quien.esAdmin ? (options.instructorId ?? quien.userId) : quien.userId

  // Y el estado tampoco sale del formulario: un curso de instructor nace en
  // borrador, lo pida el formulario o no. La 088 lo repite en un trigger.
  const status = quien.esAdmin ? data.status : 'draft'

  console.log('🔍 [Create Course] Creating course:', { title: data.title, slug: data.slug, status })

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', data.slug)
    .single()

  if (existing) {
    return { success: false, error: 'Ya existe un curso con este slug' }
  }

  // Insert course
  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      ...data,
      status,
      instructor_id: instructorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('❌ [Create Course] Error:', error)
    return { success: false, error: 'Error al crear el curso: ' + error.message }
  }

  console.log('✅ [Create Course] Course created:', course.id)

  // Assign to learning paths if specified
  const learningPathIdsRaw = formData.get('learning_path_ids') as string
  if (learningPathIdsRaw) {
    try {
      const learningPathIds: string[] = JSON.parse(learningPathIdsRaw)
      if (learningPathIds.length > 0) {
        const pathAssignments = learningPathIds.map((pathId, index) => ({
          course_id: course.id,
          learning_path_id: pathId,
          position: index,
          is_required: true,
        }))

        const { error: pathError } = await supabase
          .from('learning_path_courses')
          .insert(pathAssignments)

        if (pathError) {
          console.error('⚠️ [Create Course] Error assigning paths:', pathError)
          // Don't fail the course creation, just log the error
        } else {
          console.log('✅ [Create Course] Assigned to', learningPathIds.length, 'learning paths')
        }
      }
    } catch (e) {
      console.error('⚠️ [Create Course] Error parsing learning_path_ids:', e)
    }
  }

  // Revalidate paths
  const paths = options.revalidatePaths || ['/admin/cursos', '/dashboard/instructor/cursos']
  paths.forEach(path => revalidatePath(path))

  // Redirect if specified
  if (options.redirectTo) {
    redirect(options.redirectTo.replace('{id}', course.id))
  }

  return { success: true, courseId: course.id }
}

/**
 * Update an existing course
 */
export async function updateCourse(
  courseId: string,
  formData: FormData,
  options: {
    redirectTo?: string
    revalidatePaths?: string[]
  } = {}
): Promise<ActionResult> {
  const quien = await quienLlama()
  if (!quien) return { success: false, error: 'No autorizado' }
  if (!(await puedeTocarElCurso(courseId, quien))) {
    console.warn(`⛔ [Update Course] ${quien.rol} ${quien.userId} intento editar el curso ${courseId}`)
    return { success: false, error: 'No tienes permiso sobre este curso' }
  }

  const supabase = await createClient()
  const data = extractCourseFromFormData(formData)

  // Validate
  const validation = validateCourseData(data)
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0]
    return { success: false, error: firstError }
  }

  // `status` sale del formulario, y para quien no es administracion no se
  // escribe: se quita del payload, que NO es lo mismo que mandar el valor
  // actual. Mandar 'draft' aqui despublicaria un curso vivo.
  const { status: statusDelFormulario, ...sinEstado } = data
  let campos: Record<string, unknown> = quien.esAdmin ? data : sinEstado
  if (!quien.esAdmin && statusDelFormulario) {
    console.log(`ℹ️ [Update Course] status="${statusDelFormulario}" ignorado: lo decide la administracion`)
  }

  // LA CLASIFICACION DE UN CURSO YA PUBLICADO NO LA CAMBIA SU AUTOR.
  //
  // La auditoria lo midio: cambiar specialty_id o jurisdiccion en un curso
  // publicado NO devolvia el curso a revision, porque el trigger de la 030 lista
  // nueve columnas a mano y esas dos no estan. Asi que alguien verificado solo en
  // Fiscalidad·ES podia dejar publicado un curso que dice aplicar a Mexico, o
  // mover el curso a una especialidad en la que no esta verificado.
  //
  // La barrera de verdad es el trigger de la 114 —esto se escribe con el cliente de
  // sesion y PostgREST es alcanzable directamente—. Esto esta aqui para que la
  // persona lea una frase que le sirve en vez de un 42501, y para no mandar un
  // cambio que la base va a rechazar.
  if (!quien.esAdmin) {
    const { data: cursoActual } = await supabase
      .from('courses')
      .select('published_at, specialty_id, jurisdiccion')
      .eq('id', courseId)
      .maybeSingle()

    const yaSePublico = Boolean((cursoActual as { published_at?: string | null } | null)?.published_at)

    if (yaSePublico) {
      const actual = cursoActual as { specialty_id?: string | null; jurisdiccion?: string | null }
      const intentaCambiarEspecialidad =
        'specialty_id' in campos && campos.specialty_id !== actual.specialty_id
      const intentaCambiarJurisdiccion =
        'jurisdiccion' in campos && campos.jurisdiccion !== actual.jurisdiccion

      if (intentaCambiarEspecialidad || intentaCambiarJurisdiccion) {
        return {
          success: false,
          error: intentaCambiarEspecialidad
            ? 'La especialidad de un curso ya publicado no se cambia desde aquí: habilitaría a enseñar algo que no se ha verificado. Pídelo a la administración.'
            : 'La jurisdicción de un curso ya publicado no se cambia desde aquí: el curso dice a qué país aplica su normativa, y cambiarlo sin revisión es publicar otra cosa. Pídelo a la administración.',
        }
      }

      // Y no se reenvian aunque vengan iguales: menos ruido en el UPDATE y el
      // trigger de la 114 no tiene que entrar siquiera.
      const { specialty_id: _e, jurisdiccion: _j, ...sinClasificacion } = campos
      campos = sinClasificacion
    }
  }

  console.log('🔍 [Update Course] Updating course:', courseId)

  // Check slug uniqueness (excluding current course)
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', data.slug)
    .neq('id', courseId)
    .single()

  if (existing) {
    return { success: false, error: 'Ya existe otro curso con este slug' }
  }

  // Update course
  const { error } = await supabase
    .from('courses')
    .update({
      ...campos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)

  if (error) {
    console.error('❌ [Update Course] Error:', error)
    return { success: false, error: 'Error al actualizar el curso: ' + error.message }
  }

  console.log('✅ [Update Course] Course updated:', courseId)

  // Revalidate paths
  const paths = options.revalidatePaths || ['/admin/cursos', '/dashboard/instructor/cursos']
  paths.forEach(path => revalidatePath(path))

  // Redirect if specified
  if (options.redirectTo) {
    redirect(options.redirectTo.replace('{id}', courseId))
  }

  return { success: true, courseId }
}

/**
 * Delete a course
 */
export async function deleteCourse(
  courseId: string,
  options: {
    redirectTo?: string
    revalidatePaths?: string[]
  } = {}
): Promise<ActionResult> {
  const quien = await quienLlama()
  if (!quien) return { success: false, error: 'No autorizado' }
  if (!(await puedeTocarElCurso(courseId, quien))) {
    console.warn(`⛔ [Delete Course] ${quien.rol} ${quien.userId} intento borrar el curso ${courseId}`)
    return { success: false, error: 'No tienes permiso sobre este curso' }
  }

  const supabase = await createClient()

  console.log('🗑️ [Delete Course] Deleting course:', courseId)

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) {
    console.error('❌ [Delete Course] Error:', error)
    return { success: false, error: 'Error al eliminar el curso: ' + error.message }
  }

  console.log('✅ [Delete Course] Course deleted:', courseId)

  // Revalidate paths
  const paths = options.revalidatePaths || ['/admin/cursos', '/dashboard/instructor/cursos']
  paths.forEach(path => revalidatePath(path))

  // Redirect if specified
  if (options.redirectTo) {
    redirect(options.redirectTo)
  }

  return { success: true }
}
