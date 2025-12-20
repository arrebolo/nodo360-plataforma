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

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase } = auth
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: courses, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: courses,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase, user } = auth

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.slug) {
      return NextResponse.json(
        { error: 'Titulo y slug son requeridos' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', body.slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'El slug ya existe' },
        { status: 400 }
      )
    }

    const courseData = {
      title: body.title,
      slug: body.slug,
      description: body.description || null,
      long_description: body.long_description || null,
      thumbnail_url: body.thumbnail_url || null,
      banner_url: body.banner_url || null,
      level: body.level || 'beginner',
      category: body.category || 'bitcoin',
      status: body.status || 'draft',
      price: body.price || 0,
      is_free: body.is_free ?? true,
      is_premium: body.is_premium ?? false,
      duration_hours: body.duration_hours || 0,
      tags: body.tags || [],
      instructor_id: user.id,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      total_modules: 0,
      total_lessons: 0,
      total_duration_minutes: 0,
      enrolled_count: 0,
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: course }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
