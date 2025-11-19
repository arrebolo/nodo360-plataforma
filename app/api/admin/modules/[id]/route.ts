import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    console.log('🗑️ [Delete Module API] Iniciando eliminación')

    await requireAdmin()
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
