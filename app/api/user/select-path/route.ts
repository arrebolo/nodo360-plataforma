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
 *
 * IMPORTANTE: Este endpoint NUNCA debe devolver 500.
 * Si hay error, devuelve 200 con activePath: null para no romper la navegacion.
 *
 * Respuestas:
 * - 401: { authenticated: false } - No autenticado
 * - 200: { authenticated: true, activePath: null | {...} }
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // No autenticado
    if (authError || !user) {
      return NextResponse.json(
        { authenticated: false, activePath: null },
        { status: 401 }
      )
    }

    // Query simple para obtener ruta activa (sin JOIN problematico)
    const { data: selectedPath, error: pathError } = await supabase
      .from('user_selected_paths')
      .select('id, path_id, selected_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    // Error de BD - NO devolver 500, devolver fallback seguro
    if (pathError) {
      console.error('[API GET /user/select-path] Error BD:', pathError.message)
      return NextResponse.json({
        authenticated: true,
        activePath: null,
        _debug: { error: pathError.message, code: pathError.code }
      })
    }

    // Sin ruta activa
    if (!selectedPath || !selectedPath.path_id) {
      return NextResponse.json({
        authenticated: true,
        activePath: null
      })
    }

    // Obtener info de la ruta (query separada para evitar problemas de JOIN)
    const { data: pathInfo, error: infoError } = await supabase
      .from('learning_paths')
      .select('id, slug, name, emoji, short_description')
      .eq('id', selectedPath.path_id)
      .single()

    if (infoError || !pathInfo) {
      console.error('[API GET /user/select-path] Error pathInfo:', infoError?.message)
      // Devolver al menos que tiene ruta activa aunque no tengamos los detalles
      return NextResponse.json({
        authenticated: true,
        activePath: { id: selectedPath.path_id, selectedAt: selectedPath.selected_at }
      })
    }

    // Exito completo
    return NextResponse.json({
      authenticated: true,
      activePath: {
        ...pathInfo,
        selectedAt: selectedPath.selected_at
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[API GET /user/select-path] Exception:', errorMessage)

    // NUNCA devolver 500 - devolver fallback seguro
    return NextResponse.json({
      authenticated: false,
      activePath: null,
      _debug: { error: errorMessage }
    })
  }
}
