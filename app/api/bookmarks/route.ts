import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

// GET: Listar bookmarks del usuario
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      lesson_id,
      note,
      created_at,
      lesson:lesson_id (
        id,
        title,
        slug,
        description,
        video_duration_minutes,
        module:module_id (
          id,
          title,
          course:course_id (
            id,
            title,
            slug,
            thumbnail_url,
            level
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/bookmarks] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST: Crear bookmark
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lesson_id, note } = body

  if (!lesson_id) {
    return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({
      user_id: user.id,
      lesson_id,
      note: note || null
    }, {
      onConflict: 'user_id,lesson_id'
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/bookmarks] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// DELETE: Eliminar bookmark
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lesson_id = searchParams.get('lesson_id')

  if (!lesson_id) {
    return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('lesson_id', lesson_id)

  if (error) {
    console.error('[DELETE /api/bookmarks] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
