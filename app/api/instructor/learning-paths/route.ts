import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * Las rutas de aprendizaje que un instructor puede elegir para su curso.
 *
 * DOS DIFERENCIAS con `/api/admin/learning-paths`, y las dos importan:
 *
 *   1. Ninguna pantalla de /dashboard/instructor debe llamar a /api/admin. El permiso
 *      de esa ruta era correcto (basta tener sesión, y el catálogo de rutas es público
 *      en /rutas), pero quien audite «quién llama a /api/admin» no tiene por qué
 *      descubrir eso leyendo el código.
 *
 *   2. SOLO LAS ACTIVAS. En la auditoría, el formulario del instructor ofrecía
 *      «Ecosistema Ethereum», que está inactiva: una ruta que no se ve en la web, así
 *      que asignarle un curso no lo mete en ninguna parte. Meter el curso en una ruta
 *      apagada no es una opción, es un error que nadie ve hasta que falta el curso.
 *      La administración sigue viendo todas por su ruta, que para eso las gestiona.
 */
export async function GET(request: NextRequest) {
  const limite = await checkRateLimit(request, 'api')
  if (limite) return limite

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: paths, error } = await supabase
      .from('learning_paths')
      .select('id, name, slug, emoji, is_active')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      console.error('[instructor/learning-paths]', error.message)
      return NextResponse.json({ error: 'No se pudieron leer las rutas.' }, { status: 500 })
    }

    return NextResponse.json({ paths: paths ?? [] })
  } catch (error) {
    console.error('[instructor/learning-paths] Error inesperado:', error)
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 })
  }
}
