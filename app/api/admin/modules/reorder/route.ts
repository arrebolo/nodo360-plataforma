import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(request: Request) {
  try {
    console.log('🔄 [Reorder API] Iniciando reordenamiento')

    await requireAdmin()
    const { moduleId, courseId, direction } = await request.json()

    console.log('🔄 [Reorder API] Datos:', { moduleId, courseId, direction })

    const supabase = await createClient()

    // Obtener módulo actual
    const { data: currentModule, error: currentError } = await supabase
      .from('modules')
      .select('order_index')
      .eq('id', moduleId)
      .single()

    if (currentError || !currentModule) {
      console.error('❌ [Reorder API] Módulo no encontrado')
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
    }

    const currentIndex = currentModule.order_index
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    console.log('🔄 [Reorder API] Índices:', { currentIndex, newIndex })

    // Obtener módulo con el que intercambiar
    const { data: targetModule, error: targetError } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)
      .eq('order_index', newIndex)
      .single()

    if (targetError || !targetModule) {
      console.error('❌ [Reorder API] No se puede mover más')
      return NextResponse.json({ error: 'No se puede mover más' }, { status: 400 })
    }

    // Intercambiar order_index
    await supabase.from('modules').update({ order_index: newIndex }).eq('id', moduleId)
    await supabase.from('modules').update({ order_index: currentIndex }).eq('id', targetModule.id)

    console.log('✅ [Reorder API] Reordenamiento completado')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Reorder API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
