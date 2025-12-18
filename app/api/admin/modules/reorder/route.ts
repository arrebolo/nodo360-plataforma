import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(request: Request) {
  try {
    console.log('🔄 [Reorder Module API] Iniciando reordenamiento')

    await requireAdmin()
    const { moduleId, courseId, direction } = await request.json()

    console.log('🔄 [Reorder Module API] Datos:', { moduleId, courseId, direction })

    // 1. Obtener todos los módulos del curso ordenados
    const { data: allModules, error: allError } = await supabaseAdmin
      .from('modules')
      .select('id, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (allError || !allModules || allModules.length === 0) {
      console.error('❌ [Reorder Module API] No se encontraron módulos')
      return NextResponse.json({ error: 'No se encontraron módulos' }, { status: 404 })
    }

    // 2. Encontrar posición actual en el array
    const currentPosition = allModules.findIndex(m => m.id === moduleId)
    if (currentPosition === -1) {
      console.error('❌ [Reorder Module API] Módulo no encontrado en el curso')
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
    }

    // 3. Calcular nueva posición
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1

    console.log('🔄 [Reorder Module API] Posiciones:', { currentPosition, newPosition, total: allModules.length })

    // 4. Validar límites
    if (newPosition < 0 || newPosition >= allModules.length) {
      console.error('❌ [Reorder Module API] No se puede mover más allá de los límites')
      return NextResponse.json({ error: 'No se puede mover más' }, { status: 400 })
    }

    // 5. Obtener los módulos a intercambiar
    const currentModule = allModules[currentPosition]
    const neighborModule = allModules[newPosition]

    console.log('🔄 [Reorder Module API] Intercambiando:', {
      current: { id: currentModule.id, order: currentModule.order_index },
      neighbor: { id: neighborModule.id, order: neighborModule.order_index }
    })

    // 6. Intercambio en 3 pasos (para evitar constraint UNIQUE en order_index)

    // Paso 1: Mover módulo actual a índice temporal (-1)
    const { error: error1 } = await supabaseAdmin
      .from('modules')
      .update({ order_index: -1 })
      .eq('id', currentModule.id)

    if (error1) {
      console.error('❌ [Reorder Module API] Error paso 1:', error1)
      return NextResponse.json({ error: 'Error en reordenamiento' }, { status: 500 })
    }

    // Paso 2: Mover vecino al índice del módulo actual
    const { error: error2 } = await supabaseAdmin
      .from('modules')
      .update({ order_index: currentModule.order_index })
      .eq('id', neighborModule.id)

    if (error2) {
      console.error('❌ [Reorder Module API] Error paso 2:', error2)
      // Rollback paso 1
      await supabaseAdmin
        .from('modules')
        .update({ order_index: currentModule.order_index })
        .eq('id', currentModule.id)
      return NextResponse.json({ error: 'Error en reordenamiento' }, { status: 500 })
    }

    // Paso 3: Mover módulo actual al índice del vecino
    const { error: error3 } = await supabaseAdmin
      .from('modules')
      .update({ order_index: neighborModule.order_index })
      .eq('id', currentModule.id)

    if (error3) {
      console.error('❌ [Reorder Module API] Error paso 3:', error3)
      return NextResponse.json({ error: 'Error en reordenamiento' }, { status: 500 })
    }

    // Invalidar cache para que la UI se actualice
    revalidatePath('/admin/cursos', 'layout')

    console.log('✅ [Reorder Module API] Reordenamiento completado')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Reorder Module API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
