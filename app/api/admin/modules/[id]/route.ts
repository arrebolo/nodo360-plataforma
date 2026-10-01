import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { exigirAdminEnApi } from '@/lib/admin/auth-api'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    console.log('🗑️ [Delete Module API] Iniciando eliminación')

    // 403, no una redireccion: requireAdmin() llama a redirect(), que lanza, y la
    // excepcion acababa en el catch de esta ruta como un 500 con «NEXT_REDIRECT»
    // dentro. Medido con sesion de instructor.
    const guarda = await exigirAdminEnApi()
    if (!guarda.ok) return guarda.respuesta
    const resolvedParams = await params
    const supabase = await createClient()

    console.log('🗑️ [Delete Module API] ID del módulo:', resolvedParams.id)

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('❌ [Delete Module API] Error:', error)
      return NextResponse.json({ error: 'Error al eliminar: ' + error.message }, { status: 500 })
    }

    console.log('✅ [Delete Module API] Módulo eliminado correctamente')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Delete Module API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
