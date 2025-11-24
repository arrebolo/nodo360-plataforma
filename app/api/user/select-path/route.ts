import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/user/select-path
 * Guarda la ruta de aprendizaje seleccionada por el usuario
 * Body: { pathSlug: string }
 */
export async function POST(request: NextRequest) {
  console.log('🔍 [API POST /user/select-path] Iniciando...')

  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API POST /user/select-path] No autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    console.log('✅ [API POST /user/select-path] Usuario:', user.id)

    // 2. Obtener pathSlug del body
    const { pathSlug } = await request.json()

    if (!pathSlug) {
      console.error('❌ [API POST /user/select-path] pathSlug faltante')
      return NextResponse.json(
        { error: 'pathSlug es requerido' },
        { status: 400 }
      )
    }

    console.log('📊 [API POST /user/select-path] Path:', pathSlug)

    // 3. Verificar que la ruta existe y está activa
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('id, title')
      .eq('slug', pathSlug)
      .eq('is_active', true)
      .single()

    if (pathError || !path) {
      console.error('❌ [API POST /user/select-path] Ruta no encontrada:', pathError)
      return NextResponse.json(
        { error: 'Ruta de aprendizaje no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ [API POST /user/select-path] Ruta encontrada:', path.title)

    // 4. Desactivar cualquier ruta activa anterior
    const { error: deactivateError } = await supabase
      .from('user_selected_paths')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (deactivateError) {
      console.error('⚠️  [API POST /user/select-path] Error al desactivar rutas anteriores:', deactivateError)
    }

    // 5. Guardar nueva ruta como activa (upsert para evitar duplicados)
    const { data: selectedPath, error: selectError } = await supabase
      .from('user_selected_paths')
      .upsert({
        user_id: user.id,
        path_id: path.id,
        is_active: true,
        selected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,path_id'
      })
      .select()
      .single()

    if (selectError) {
      console.error('❌ [API POST /user/select-path] Error al guardar:', selectError)
      return NextResponse.json(
        { error: 'Error al guardar ruta' },
        { status: 500 }
      )
    }

    console.log('✅ [API POST /user/select-path] Ruta guardada exitosamente')

    return NextResponse.json({
      success: true,
      message: `Ruta "${path.title}" seleccionada exitosamente`,
      path: {
        id: path.id,
        title: path.title
      }
    }, { status: 201 })
  } catch (error) {
    console.error('❌ [API POST /user/select-path] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/select-path
 * Obtiene la ruta activa del usuario
 */
export async function GET() {
  console.log('🔍 [API GET /user/select-path] Iniciando...')

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener ruta activa con información completa
    const { data: activePath, error } = await supabase
      .from('user_selected_paths')
      .select(`
        id,
        selected_at,
        learning_paths!inner(
          id,
          slug,
          title,
          description,
          icon,
          difficulty,
          estimated_hours,
          color_from,
          color_to
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('❌ [API GET /user/select-path] Error:', error)
      return NextResponse.json(
        { error: 'Error al obtener ruta' },
        { status: 500 }
      )
    }

    if (!activePath) {
      return NextResponse.json({
        activePath: null
      })
    }

    return NextResponse.json({
      activePath: {
        ...(activePath.learning_paths as any),
        selectedAt: activePath.selected_at
      }
    })
  } catch (error) {
    console.error('❌ [API GET /user/select-path] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
