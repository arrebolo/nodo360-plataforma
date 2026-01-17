import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { checkRateLimit } from '@/lib/ratelimit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    console.log('🗑️ [DELETE Course API] Iniciando eliminación')

    // Verificar permisos
    await requireAdmin()

    const resolvedParams = await params
    const supabase = await createClient()

    console.log('🗑️ [DELETE Course API] ID del curso:', resolvedParams.id)

    // Eliminar curso (ON DELETE CASCADE eliminará módulos y lecciones)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('❌ [DELETE Course API] Error:', error)
      return NextResponse.json(
        { error: 'Error al eliminar curso: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ [DELETE Course API] Curso eliminado correctamente')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [DELETE Course API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor: ' + error.message },
      { status: 500 }
    )
  }
}
