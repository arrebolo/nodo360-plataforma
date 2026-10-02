/**
 * Borrar un modulo, desde el panel de administracion.
 *
 * La logica esta en lib/courses/contenido.ts, compartida con /api/instructor/...: es
 * un intercambio en tres pasos con un indice temporal, y dos copias se desfasarian.
 * Aqui solo cambia el permiso: esta ruta exige admin.
 */
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { exigirAdminEnApi } from '@/lib/admin/auth-api'
import { borrarModulo, moduloConSuCurso } from '@/lib/courses/contenido'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limite = await checkRateLimit(request, 'api')
  if (limite) return limite

  try {
    // 403, no una redireccion: requireAdmin() llama a redirect(), que lanza, y la
    // excepcion acababa en el catch de esta ruta como un 500 con «NEXT_REDIRECT»
    // dentro. Medido con sesion de instructor.
    const guarda = await exigirAdminEnApi()
    if (!guarda.ok) return guarda.respuesta

    const { id } = await params
    const modulo = await moduloConSuCurso(id)
    if (!modulo) {
      return NextResponse.json({ error: 'El módulo no existe.' }, { status: 404 })
    }

    const resultado = await borrarModulo(modulo)
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.estado })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/modules] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
