import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { recalcularMatriculasDelCurso } from '@/lib/progress/recalcularMatriculas'
import { exigirAdminEnApi } from '@/lib/admin/auth-api'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    console.log('🗑️ [Delete Lesson API] Iniciando eliminación')

    // 403, no una redireccion: requireAdmin() llama a redirect(), que lanza, y la
    // excepcion acababa en el catch de esta ruta como un 500 con «NEXT_REDIRECT»
    // dentro. Medido con sesion de instructor.
    const guarda = await exigirAdminEnApi()
    if (!guarda.ok) return guarda.respuesta
    const resolvedParams = await params
    const supabase = await createClient()

    console.log('🗑️ [Delete Lesson API] ID de la lección:', resolvedParams.id)

    // Hay que saber de que curso era ANTES de borrarla: despues ya no hay
    // fila que preguntar. Y borrar una leccion arrastra su user_progress
    // por ON DELETE CASCADE, asi que el progreso de otras personas cambia
    // sin que ellas hagan nada.
    const { data: leccion } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('❌ [Delete Lesson API] Error:', error)
      return NextResponse.json({ error: 'Error al eliminar: ' + error.message }, { status: 500 })
    }

    if (leccion?.course_id) {
      await recalcularMatriculasDelCurso(leccion.course_id)
    }

    console.log('✅ [Delete Lesson API] Lección eliminada correctamente')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Delete Lesson API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
