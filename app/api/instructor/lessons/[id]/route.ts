import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { permisoSobreElCurso } from '@/lib/courses/permiso-sobre-el-curso'
import { borrarLeccion, leccionConSuCurso } from '@/lib/courses/contenido'

/**
 * Borrar una lección de un curso propio.
 *
 * El curso sale del MODULO de la lección —lección → módulo → curso—, no de
 * `lessons.course_id`, que es una copia.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limite = await checkRateLimit(request, 'api')
  if (limite) return limite

  try {
    const { id } = await params

    const leccion = await leccionConSuCurso(id)
    if (!leccion) return NextResponse.json({ error: 'La lección no existe.' }, { status: 404 })

    const permiso = await permisoSobreElCurso(leccion.course_id)
    if (!permiso.ok) return permiso.respuesta

    const resultado = await borrarLeccion(id)
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.estado })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[instructor/lessons] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
