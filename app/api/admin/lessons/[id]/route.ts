import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    console.log('🗑️ [Delete Lesson API] Iniciando eliminación')

    await requireAdmin()
    const resolvedParams = await params

    console.log('🗑️ [Delete Lesson API] ID de la lección:', resolvedParams.id)

    // Eliminar lección (usar admin para bypass RLS)
    const { error } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('❌ [Delete Lesson API] Error:', error)
      return NextResponse.json({ error: 'Error al eliminar: ' + error.message }, { status: 500 })
    }

    console.log('✅ [Delete Lesson API] Lección eliminada correctamente')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Delete Lesson API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
