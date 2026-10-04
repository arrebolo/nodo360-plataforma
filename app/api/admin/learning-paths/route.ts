import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { exigirAdminEnApi } from '@/lib/admin/auth-api'

/**
 * El catálogo COMPLETO de rutas de aprendizaje, activas e inactivas.
 *
 * EXIGE ADMIN, y hasta la auditoría no lo hacía: bastaba tener sesión. O sea que
 * cualquier alumno podía pedir a una ruta de `/api/admin` la lista entera, inactivas
 * incluidas —las que no se ven en la web— y eso es estructura de la plataforma, no
 * contenido suyo.
 *
 * No era grave: son nombres de rutas, y las activas ya se ven en /rutas. Lo que sí era
 * es engañoso, porque quien audite «qué rutas de /api/admin dejan pasar a quien no es
 * admin» tenía que leerse el código para descubrir que esta sí.
 *
 * QUIEN LAS NECESITA SIN SER ADMIN usa `/api/instructor/learning-paths`, que devuelve
 * lo mismo con dos diferencias: exige solo sesión y devuelve SOLO LAS ACTIVAS, que es
 * lo único que tiene sentido ofrecer para asignar un curso.
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const guarda = await exigirAdminEnApi()
    if (!guarda.ok) return guarda.respuesta

    const supabase = await createClient()

    const { data: paths, error } = await supabase
      .from('learning_paths')
      .select('id, name, slug, emoji, is_active')
      .order('position', { ascending: true })

    if (error) {
      console.error('[Learning Paths] Error:', error)
      throw error
    }

    return NextResponse.json({ paths: paths || [] })
  } catch (error) {
    console.error('[Learning Paths] Error:', error)
    return NextResponse.json({ error: 'Error obteniendo rutas' }, { status: 500 })
  }
}

// POST: Crear nueva ruta (opcional, para futuro uso)
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // CREAR una ruta de aprendizaje es estructura de la plataforma, no contenido de
    // un curso: solo la administracion. El rol instructor estaba aqui para que su
    // formulario pudiera LEER el catalogo (el GET), no para crear rutas.
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, short_description, emoji } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
    }

    const { data: path, error } = await supabase
      .from('learning_paths')
      .insert({
        name,
        slug,
        short_description,
        emoji,
        is_active: false,
        position: 99,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El slug ya existe' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ path })
  } catch (error) {
    console.error('[Learning Paths] Error:', error)
    return NextResponse.json({ error: 'Error creando ruta' }, { status: 500 })
  }
}
