import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { permisoSobreElCurso } from '@/lib/courses/permiso-sobre-el-curso'
import { borrarModulo, moduloConSuCurso } from '@/lib/courses/contenido'

/**
 * Borrar un módulo propio.
 *
 * La ruta de administración (`/api/admin/modules/[id]`) exige admin, así que el botón
 * «borrar módulo» del editor del instructor recibía **403** y no decía nada útil.
 *
 * EL CURSO SE DERIVA DEL MODULO, y el permiso se comprueba sobre ese curso: quien llama
 * no manda a qué curso pertenece lo que borra.
 *
 * El progreso de los alumnos no corre peligro: desde la 117,
 * `user_progress.lesson_id` apunta a `lessons_publicadas` —la copia publicada— con
 * RESTRICT, y esa copia no se borra nunca, solo se retira. Medido:
 * `user_progress_lesson_id_espejo_fk`.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limite = await checkRateLimit(request, 'api')
  if (limite) return limite

  try {
    const { id } = await params

    const modulo = await moduloConSuCurso(id)
    if (!modulo) return NextResponse.json({ error: 'El módulo no existe.' }, { status: 404 })

    const permiso = await permisoSobreElCurso(modulo.course_id)
    if (!permiso.ok) return permiso.respuesta

    const resultado = await borrarModulo(id)
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.estado })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[instructor/modules] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
