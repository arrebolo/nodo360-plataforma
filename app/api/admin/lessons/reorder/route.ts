import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(request: Request) {
  try {
    console.log('🔄 [Reorder Lesson API] Iniciando reordenamiento')

    await requireAdmin()
    const { lessonId, moduleId, direction } = await request.json()

    console.log('🔄 [Reorder Lesson API] Datos:', { lessonId, moduleId, direction })

    // 1. Obtener todas las lecciones del módulo ordenadas
    const { data: allLessons, error: allError } = await supabaseAdmin
      .from('lessons')
      .select('id, order_index')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true })

    if (allError || !allLessons || allLessons.length === 0) {
      console.error('❌ [Reorder Lesson API] No se encontraron lecciones')
      return NextResponse.json({ error: 'No se encontraron lecciones' }, { status: 404 })
    }

    // 2. Encontrar posición actual en el array
    const currentPosition = allLessons.findIndex(l => l.id === lessonId)
    if (currentPosition === -1) {
      console.error('❌ [Reorder Lesson API] Lección no encontrada en el módulo')
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    // 3. Calcular nueva posición
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1

    console.log('🔄 [Reorder Lesson API] Posiciones:', { currentPosition, newPosition, total: allLessons.length })

    // 4. Validar límites
    if (newPosition < 0 || newPosition >= allLessons.length) {
      console.error('❌ [Reorder Lesson API] No se puede mover más allá de los límites')
      return NextResponse.json({ error: 'No se puede mover más' }, { status: 400 })
    }

    // 5. Obtener las lecciones a intercambiar
    const currentLesson = allLessons[currentPosition]
    const neighborLesson = allLessons[newPosition]

    console.log('🔄 [Reorder Lesson API] Intercambiando:', {
      current: { id: currentLesson.id, order: currentLesson.order_index },
      neighbor: { id: neighborLesson.id, order: neighborLesson.order_index }
    })

    // 6. Intercambio en 3 pasos (para evitar constraint UNIQUE en order_index)

    // Paso 1: Mover lección actual a índice temporal (-1)
    const { error: error1 } = await supabaseAdmin
      .from('lessons')
      .update({ order_index: -1 })
      .eq('id', currentLesson.id)

    if (error1) {
      console.error('❌ [Reorder Lesson API] Error paso 1:', error1)
      return NextResponse.json({ error: 'Error en reordenamiento' }, { status: 500 })
    }

    // Paso 2: Mover vecino al índice de la lección actual
    const { error: error2 } = await supabaseAdmin
      .from('lessons')
      .update({ order_index: currentLesson.order_index })
      .eq('id', neighborLesson.id)

    if (error2) {
      console.error('❌ [Reorder Lesson API] Error paso 2:', error2)
      // Rollback paso 1
      await supabaseAdmin
        .from('lessons')
        .update({ order_index: currentLesson.order_index })
        .eq('id', currentLesson.id)
      return NextResponse.json({ error: 'Error en reordenamiento' }, { status: 500 })
    }

    // Paso 3: Mover lección actual al índice del vecino
    const { error: error3 } = await supabaseAdmin
      .from('lessons')
      .update({ order_index: neighborLesson.order_index })
      .eq('id', currentLesson.id)

    if (error3) {
      console.error('❌ [Reorder Lesson API] Error paso 3:', error3)
      return NextResponse.json({ error: 'Error en reordenamiento' }, { status: 500 })
    }

    // Invalidar cache para que la UI se actualice
    revalidatePath('/admin/cursos', 'layout')

    console.log('✅ [Reorder Lesson API] Reordenamiento completado')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Reorder Lesson API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
