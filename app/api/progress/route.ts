import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/progress
 * Marca una lección como completada
 * Body: { lessonId: string }
 *
 * SIMPLE: Solo guarda el progreso. El Server Component recalculará TODO.
 */
export async function POST(request: NextRequest) {
  console.log('🔍 [API POST /progress] Iniciando...')

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API POST /progress] No autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    const { lessonId } = await request.json()

    if (!lessonId) {
      console.error('❌ [API POST /progress] lessonId faltante')
      return NextResponse.json(
        { error: 'lessonId es requerido' },
        { status: 400 }
      )
    }

    console.log('📊 [API POST /progress] Guardando progreso:', {
      userId: user.id,
      lessonId
    })

    // Guardar progreso (upsert)
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          watch_time_seconds: 0,
        },
        {
          onConflict: 'user_id,lesson_id'
        }
      )

    if (progressError) {
      console.error('❌ [API POST /progress] Error al guardar:', progressError)
      return NextResponse.json(
        { error: 'Error al guardar progreso' },
        { status: 500 }
      )
    }

    console.log('✅ [API POST /progress] Progreso guardado correctamente')

    return NextResponse.json({
      success: true,
      message: 'Lección completada'
    })
  } catch (error) {
    console.error('❌ [API POST /progress] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
