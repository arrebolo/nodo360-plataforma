// app/api/admin/courses/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Cliente con service_role para bypass de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  console.log('[API Admin Courses] POST - Crear curso')

  try {
    // Verificar autenticacion
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()

    // Extraer path_id del body
    const { path_id, ...courseData } = body

    console.log('[API Admin Courses] Datos recibidos:', courseData.title)

    // Insertar curso
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .insert({
        title: courseData.title,
        slug: courseData.slug,
        subtitle: courseData.subtitle || null,
        description: courseData.description || null,
        duration_label: courseData.duration_label || null,
        is_premium: courseData.is_premium ?? false,
        is_certifiable: courseData.is_certifiable ?? true,
        published_at: courseData.published_at || null,
        difficulty_level: courseData.difficulty_level || null,
        topic_category: courseData.topic_category || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[API Admin Courses] Error insertando:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si hay path_id, crear relacion en path_courses
    if (path_id) {
      console.log('[API Admin Courses] Asignando a ruta:', path_id)

      // Calcular order_index al final de la ruta
      const { data: rows } = await supabaseAdmin
        .from('path_courses')
        .select('order_index')
        .eq('path_id', path_id)
        .order('order_index', { ascending: false })
        .limit(1)

      const orderIndex = rows?.[0]?.order_index ? rows[0].order_index + 1 : 1

      const { error: pathError } = await supabaseAdmin
        .from('path_courses')
        .insert({
          path_id,
          course_id: course.id,
          order_index: orderIndex,
          is_required: true,
        })

      if (pathError) {
        console.error('[API Admin Courses] Error asignando ruta:', pathError.message)
        // No fallamos, el curso ya se creo
      }
    }

    console.log('[API Admin Courses] Curso creado:', course.id)
    return NextResponse.json({ course }, { status: 201 })

  } catch (err: any) {
    console.error('[API Admin Courses] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
