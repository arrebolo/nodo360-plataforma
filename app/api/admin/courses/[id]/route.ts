import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['admin@nodo360.com', 'alberto@nodo360.com']

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', status: 401 }
  }

  const userRole = user.user_metadata?.role || 'user'
  const isAdmin = userRole === 'admin' || ADMIN_EMAILS.includes(user.email || '')

  if (!isAdmin) {
    return { error: 'No autorizado', status: 403 }
  }

  return { user, supabase }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase } = auth
  const { id } = await params

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules:modules(
        id,
        title,
        order_index,
        lessons:lessons(id, title, order_index)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data: course })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase } = auth
  const { id } = await params

  try {
    const body = await request.json()

    // Check if slug changed and if new slug exists
    if (body.slug) {
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'El slug ya existe' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that were sent
    const allowedFields = [
      'title', 'slug', 'description', 'long_description',
      'thumbnail_url', 'banner_url', 'level', 'category',
      'status', 'price', 'is_free', 'is_premium',
      'duration_hours', 'tags', 'meta_title', 'meta_description'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle publishing
    if (body.status === 'published') {
      const { data: current } = await supabase
        .from('courses')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!current?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: course })
  } catch (err) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase } = auth
  const { id } = await params

  // Check if course has enrollments
  const { count } = await supabase
    .from('course_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar un curso con estudiantes inscritos' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
