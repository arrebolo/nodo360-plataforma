import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(request: Request) {
  try {
    console.log('🔄 [Reorder Lesson API] Iniciando reordenamiento')

    await requireAdmin()
    const { lessonId, moduleId, direction } = await request.json()

    console.log('🔄 [Reorder Lesson API] Datos:', { lessonId, moduleId, direction })

    const supabase = await createClient()

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

    // Intercambiar order_index
    await supabase.from('lessons').update({ order_index: newIndex }).eq('id', lessonId)
    await supabase.from('lessons').update({ order_index: currentIndex }).eq('id', targetLesson.id)

    console.log('✅ [Reorder Lesson API] Reordenamiento completado')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [Reorder Lesson API] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
