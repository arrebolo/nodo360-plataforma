import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { permisoSobreElCurso } from '@/lib/courses/permiso-sobre-el-curso'
import { direccionValida, leccionConSuCurso, moverLeccion } from '@/lib/courses/contenido'

/**
 * Subir o bajar una lección dentro de su módulo, en un curso propio.
 *
 * `moduleId` del cuerpo se ignora: el módulo sale de la fila de la lección. Las
 * lecciones se ordenan dentro de su módulo, así que es ese módulo —y no el que mande
 * quien llama— el que delimita con quién se intercambia.
 */
export async function POST(request: Request) {
  const limite = await checkRateLimit(request, 'api')
  if (limite) return limite

  try {
    const cuerpo = await request.json().catch(() => ({}))
    const lessonId = typeof cuerpo.lessonId === 'string' ? cuerpo.lessonId : ''
    const direccion = direccionValida(cuerpo.direction)

    if (!lessonId) return NextResponse.json({ error: 'Falta la lección.' }, { status: 400 })
    if (!direccion) {
      return NextResponse.json({ error: 'La dirección tiene que ser «up» o «down».' }, { status: 400 })
    }

    const leccion = await leccionConSuCurso(lessonId)
    if (!leccion) return NextResponse.json({ error: 'La lección no existe.' }, { status: 404 })

    const permiso = await permisoSobreElCurso(leccion.course_id)
    if (!permiso.ok) return permiso.respuesta

    const resultado = await moverLeccion(leccion, direccion)
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.estado })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[instructor/lessons/reorder] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
