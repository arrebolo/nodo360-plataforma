import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Listar notas (opcionalmente filtrar por lesson_id)
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lesson_id = searchParams.get('lesson_id')

  let query = supabase
    .from('notes')
    .select(`
      id,
      content,
      video_timestamp_seconds,
      created_at,
      updated_at,
      lesson_id,
      lesson:lesson_id (
        id,
        title,
        slug,
        module:module_id (
          id,
          title,
          course:course_id (
            id,
            title,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (lesson_id) {
    query = query.eq('lesson_id', lesson_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [GET /api/lesson-notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST: Crear nota
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lesson_id, content, video_timestamp_seconds } = body

  if (!lesson_id || !content?.trim()) {
    return NextResponse.json({ error: 'lesson_id and content are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      lesson_id,
      content: content.trim(),
      video_timestamp_seconds: video_timestamp_seconds ?? null
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [POST /api/lesson-notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// PUT: Actualizar nota
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, content, video_timestamp_seconds } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (content !== undefined) updateData.content = content.trim()
  if (video_timestamp_seconds !== undefined) updateData.video_timestamp_seconds = video_timestamp_seconds

  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('❌ [PUT /api/lesson-notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE: Eliminar nota
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('❌ [DELETE /api/lesson-notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
