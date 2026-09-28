import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getMiPerfil } from '@/lib/auth/miPerfil'

/**
 * POST /api/user/select-path
 * Guarda la ruta de aprendizaje seleccionada en users.active_path_id
 * Body: { slug: string, redirect?: string }
 */
export async function POST(req: Request) {
  console.log('🔍 [API POST /user/select-path] Iniciando...')

  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(req, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const supabase = await createClient()

    const { slug, redirect = '/dashboard/rutas' } = await req.json()

    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const userId = auth.user.id
    console.log('✅ [API POST /user/select-path] Usuario:', userId)
    console.log('📊 [API POST /user/select-path] Path slug:', slug)

    if (!slug) {
      return NextResponse.json(
        { error: 'Falta slug' },
        { status: 400 }
      )
    }

    // 1) Buscar ruta por slug (usar columnas reales: name, NO title)
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('id, slug, name')
      .eq('slug', slug)
      .maybeSingle()

    if (pathError) {
      console.error('❌ [API POST /user/select-path] Error buscando ruta:', pathError)
      return NextResponse.json(
        { error: pathError.message },
        { status: 500 }
      )
    }

    if (!path) {
      console.error('❌ [API POST /user/select-path] Ruta no encontrada (slug):', slug)
      return NextResponse.json(
        { error: 'Ruta de aprendizaje no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ [API POST /user/select-path] Ruta encontrada:', path.name)

    // 2) Guardar ruta activa en users.active_path_id
    const { data: updated, error: updError } = await supabase
      .from('users')
      .update({ active_path_id: path.id })
      .eq('id', userId)
      // Solo `id`: active_path_id no es una columna publica desde la 049, asi
      // que pedirla de vuelta hacia fallar el propio UPDATE por privilegios de
      // columna. `id` basta para saber si la fila se ha actualizado.
      .select('id')
      .maybeSingle()

    console.log('🧾 [API POST /user/select-path] Updated row:', updated)

    if (updError) {
      console.error('❌ [API POST /user/select-path] Error guardando active_path_id:', updError)
      return NextResponse.json(
        { error: updError.message },
        { status: 500 }
      )
    }

    if (!updated) {
      console.error('⚠️ [API POST /user/select-path] UPDATE no afectó ninguna fila - posible RLS o WHERE incorrecto')
      return NextResponse.json(
        { error: 'No se pudo actualizar el usuario - verifica permisos' },
        { status: 403 }
      )
    }

    console.log('✅ [API POST /user/select-path] Ruta guardada para usuario:', userId)

    // 3) Respuesta consistente
    return NextResponse.json({
      ok: true,
      success: true, // Para compatibilidad con RouteCardWrapper
      activePath: path,
      redirect,
    })
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado'
    console.error('❌ [API POST /user/select-path] Exception:', e)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/select-path
 * Obtiene la ruta activa del usuario desde users.active_path_id
 */
export async function GET(request: Request) {
  console.log('🔍 [API GET /user/select-path] Iniciando...')

  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const supabase = await createClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()

    if (authError || !auth?.user) {
      return NextResponse.json(
        { authenticated: false, activePath: null },
        { status: 401 }
      )
    }

    // 1) Obtener active_path_id del usuario
    //
    // Por mi_perfil(), NO por un select sobre users: active_path_id no es una
    // columna publica desde la 049, asi que el select directo fallaba y esta
    // ruta contestaba activePath: null a todo el mundo. Quien la consume es
    // LogoLink, que con esa respuesta mandaba a /dashboard/rutas a elegir una
    // ruta a quien ya tenia una elegida.
    const perfil = await getMiPerfil()

    if (!perfil) {
      console.error('[API GET /user/select-path] mi_perfil() no ha devuelto nada')
      return NextResponse.json({
        authenticated: true,
        activePath: null
      })
    }

    const activePathId = perfil.active_path_id

    if (!activePathId) {
      return NextResponse.json({
        authenticated: true,
        activePath: null
      })
    }

    // 2) Obtener info de la ruta
    const { data: pathInfo, error: pathError } = await supabase
      .from('learning_paths')
      .select('id, slug, name, emoji, short_description')
      .eq('id', activePathId)
      .single()

    if (pathError || !pathInfo) {
      console.error('[API GET /user/select-path] Error obteniendo ruta:', pathError)
      return NextResponse.json({
        authenticated: true,
        activePath: { id: activePathId }
      })
    }

    return NextResponse.json({
      authenticated: true,
      activePath: pathInfo
    })

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido'
    console.error('[API GET /user/select-path] Exception:', errorMessage)
    return NextResponse.json({
      authenticated: false,
      activePath: null,
      _debug: { error: errorMessage }
    })
  }
}


