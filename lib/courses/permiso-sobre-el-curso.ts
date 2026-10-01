import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * ¿Puede quien llama tocar ESTE curso?
 *
 * POR QUE EXISTE, MEDIDO
 *   Tres rutas de /api/admin admiten rol `instructor` y escriben con el cliente de
 *   servicio, que salta la RLS, sin mirar de quién es el curso. Con una sesión de
 *   instructor de verdad, sobre el curso de OTRO instructor:
 *
 *     POST   /api/admin/courses/<ajeno>/paths           200, y la fila quedó creada
 *     POST   /api/admin/courses/<ajeno>/refresh-counts  200
 *     GET    /api/admin/courses/<ajeno>/paths           200
 *
 *   O sea que un instructor podía meter el curso de otro en una ruta de aprendizaje.
 *   No es catastrófico —no cambia el contenido— pero es decidir sobre el trabajo de
 *   otra persona, y no hay ninguna razón para poder hacerlo.
 *
 * LAS REGLAS, las mismas que para el examen final (lib/quiz/permiso-del-examen.ts):
 *   admin       cualquier curso
 *   mentor      cualquier curso: revisa
 *   instructor  solo los suyos (courses.instructor_id)
 *   cualquier otro rol, o sin sesión: no
 */
const ROLES_CON_ACCESO = ['admin', 'instructor', 'mentor'] as const

export type PermisoCurso =
  | { ok: true; userId: string; rol: string; esSuyo: boolean }
  | { ok: false; respuesta: NextResponse }

function no(mensaje: string, estado: number): PermisoCurso {
  return { ok: false, respuesta: NextResponse.json({ error: mensaje }, { status: estado }) }
}

export async function permisoSobreElCurso(courseId: string): Promise<PermisoCurso> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return no('No autorizado', 401)

  const { data: perfil } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const rol = (perfil?.role as string | undefined) ?? ''
  if (!ROLES_CON_ACCESO.includes(rol as (typeof ROLES_CON_ACCESO)[number])) {
    return no('Acceso denegado', 403)
  }

  if (!courseId) return no('Falta el curso', 400)

  // Con el cliente de servicio: hace falta saber de quién es el curso ANTES de
  // decidir, y para eso hay que poder leerlo.
  const { data: curso } = await createAdminClient()
    .from('courses')
    .select('id, instructor_id')
    .eq('id', courseId)
    .maybeSingle()

  if (!curso) return no('El curso no existe', 404)

  const esSuyo = curso.instructor_id === user.id

  if (rol === 'instructor' && !esSuyo) {
    return no('Este curso no es tuyo.', 403)
  }

  return { ok: true, userId: user.id, rol, esSuyo }
}
