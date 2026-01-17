import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    console.log('🔄 [Reorder Lesson API] Iniciando reordenamiento')

    await requireAdmin()
    const { lessonId, moduleId, direction } = await request.json()

    console.log('🔄 [Reorder Lesson API] Datos:', { lessonId, moduleId, direction })

    const supabase = createAdminClient()

    // Obtener lección actual
    const { data: currentLesson, error: currentError } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('id', lessonId)
      .single()

    if (currentError || !currentLesson) {
      console.error('❌ [Reorder Lesson API] Lección no encontrada')
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    const currentIndex = currentLesson.order_index
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    console.log('🔄 [Reorder Lesson API] Índices:', { currentIndex, newIndex })

    // Obtener lección con la que intercambiar
    const { data: targetLesson, error: targetError } = await supabase
      .from('lessons')
      .select('id')
      .eq('module_id', moduleId)
      .eq('order_index', newIndex)
      .single()

    if (targetError || !targetLesson) {
      console.error('❌ [Reorder Lesson API] No se puede mover más')
      return NextResponse.json({ error: 'No se puede mover más' }, { status: 400 })
    }

    // Intercambiar order_index usando índice temporal para evitar unique constraint
    // PASO 1: Mover lección actual a índice temporal (-1)
    console.log('🔄 [Reorder Lesson API] Paso 1: Moviendo a índice temporal:', { id: lessonId, tempIndex: -1 })
    const { error: tempError } = await supabase
      .from('lessons')
      .update({ order_index: -1 })
      .eq('id', lessonId)

    if (tempError) {
      console.error('❌ [Reorder Lesson API] Error en paso 1:', tempError)
      return NextResponse.json({ error: 'Error moviendo a temporal: ' + tempError.message }, { status: 500 })
    }

    // PASO 2: Mover lección target al índice que dejó libre la primera
    console.log('🔄 [Reorder Lesson API] Paso 2: Moviendo target:', { id: targetLesson.id, index: currentIndex })
    const { error: updateError2 } = await supabase
      .from('lessons')
      .update({ order_index: currentIndex })
      .eq('id', targetLesson.id)

    if (updateError2) {
      console.error('❌ [Reorder Lesson API] Error en paso 2:', updateError2)
      // Intentar revertir paso 1
      await supabase.from('lessons').update({ order_index: currentIndex }).eq('id', lessonId)
      return NextResponse.json({ error: 'Error actualizando target: ' + updateError2.message }, { status: 500 })
    }

    // PASO 3: Mover primera lección a su posición final
    console.log('🔄 [Reorder Lesson API] Paso 3: Moviendo a posición final:', { id: lessonId, index: newIndex })
    const { error: updateError3 } = await supabase
      .from('lessons')
      .update({ order_index: newIndex })
      .eq('id', lessonId)

    if (updateError3) {
      console.error('❌ [Reorder Lesson API] Error en paso 3:', updateError3)
      return NextResponse.json({ error: 'Error moviendo a posición final: ' + updateError3.message }, { status: 500 })
    }

    console.log('✅ [Reorder Lesson API] Reordenamiento completado exitosamente')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Reorder Lesson API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}


