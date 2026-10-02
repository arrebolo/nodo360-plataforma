import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { permisoSobreElCurso } from '@/lib/courses/permiso-sobre-el-curso'
import { direccionValida, moduloConSuCurso, moverModulo } from '@/lib/courses/contenido'

/**
 * Subir o bajar un módulo de un curso propio.
 *
 * `courseId` llegaba en el cuerpo y se usaba para buscar el módulo vecino con el que
 * intercambiar. Aquí se IGNORA: el curso sale de la fila del módulo. Si se creyera al
 * cuerpo, comprobar el permiso sobre ese curso no diría nada sobre el módulo que se
 * mueve, y bastaría con mandar un curso propio para reordenar el de otro.
 */
export async function POST(request: Request) {
  const limite = await checkRateLimit(request, 'api')
  if (limite) return limite

  try {
    const cuerpo = await request.json().catch(() => ({}))
    const moduleId = typeof cuerpo.moduleId === 'string' ? cuerpo.moduleId : ''
    const direccion = direccionValida(cuerpo.direction)

    if (!moduleId) return NextResponse.json({ error: 'Falta el módulo.' }, { status: 400 })
    if (!direccion) {
      return NextResponse.json({ error: 'La dirección tiene que ser «up» o «down».' }, { status: 400 })
    }

    const modulo = await moduloConSuCurso(moduleId)
    if (!modulo) return NextResponse.json({ error: 'El módulo no existe.' }, { status: 404 })

    const permiso = await permisoSobreElCurso(modulo.course_id)
    if (!permiso.ok) return permiso.respuesta

    const resultado = await moverModulo(modulo, direccion)
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.estado })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[instructor/modules/reorder] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
