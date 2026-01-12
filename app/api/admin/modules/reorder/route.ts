import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(request: Request) {
  try {
    console.log('🔄 [Reorder API] Iniciando reordenamiento')

    await requireAdmin()
    const { moduleId, courseId, direction } = await request.json()

    console.log('🔄 [Reorder API] Datos:', { moduleId, courseId, direction })

    const supabase = createAdminClient()

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

    // Intercambiar order_index usando índice temporal para evitar unique constraint
    // PASO 1: Mover módulo actual a índice temporal (-1)
    console.log('🔄 [Reorder API] Paso 1: Moviendo a índice temporal:', { id: moduleId, tempIndex: -1 })
    const { error: tempError } = await supabase
      .from('modules')
      .update({ order_index: -1 })
      .eq('id', moduleId)

    if (tempError) {
      console.error('❌ [Reorder API] Error en paso 1:', tempError)
      return NextResponse.json({ error: 'Error moviendo a temporal: ' + tempError.message }, { status: 500 })
    }

    // PASO 2: Mover módulo target al índice que dejó libre el primero
    console.log('🔄 [Reorder API] Paso 2: Moviendo target:', { id: targetModule.id, index: currentIndex })
    const { error: updateError2 } = await supabase
      .from('modules')
      .update({ order_index: currentIndex })
      .eq('id', targetModule.id)

    if (updateError2) {
      console.error('❌ [Reorder API] Error en paso 2:', updateError2)
      // Intentar revertir paso 1
      await supabase.from('modules').update({ order_index: currentIndex }).eq('id', moduleId)
      return NextResponse.json({ error: 'Error actualizando target: ' + updateError2.message }, { status: 500 })
    }

    // PASO 3: Mover primer módulo a su posición final
    console.log('🔄 [Reorder API] Paso 3: Moviendo a posición final:', { id: moduleId, index: newIndex })
    const { error: updateError3 } = await supabase
      .from('modules')
      .update({ order_index: newIndex })
      .eq('id', moduleId)

    if (updateError3) {
      console.error('❌ [Reorder API] Error en paso 3:', updateError3)
      return NextResponse.json({ error: 'Error moviendo a posición final: ' + updateError3.message }, { status: 500 })
    }

    console.log('✅ [Reorder API] Reordenamiento completado exitosamente')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Reorder API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}


