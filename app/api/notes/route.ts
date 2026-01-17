import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

const isUuid = (v?: string | null) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

type NoteDTO = { id: string; content: string; updated_at: string }

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')

    if (!isUuid(lessonId)) {
      return NextResponse.json({ error: 'lessonId es requerido y debe ser UUID válido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_notes')
      .select('id, note_text, updated_at')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (error) {
      console.error('❌ [API GET /notes] Supabase error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    const note: NoteDTO | null = data
      ? { id: data.id, content: data.note_text ?? '', updated_at: data.updated_at }
      : null

    return NextResponse.json({ note })
  } catch (e) {
    console.error('❌ [API GET /notes] Exception:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const lessonId = body?.lessonId
    const content = body?.content

    if (!isUuid(lessonId)) {
      return NextResponse.json({ error: 'lessonId es requerido y debe ser UUID válido' }, { status: 400 })
    }

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content debe ser string' }, { status: 400 })
    }

    console.log('[POST /notes] user_id:', user.id, 'lessonId:', lessonId)

    const { error } = await supabase
      .from('user_notes')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          note_text: content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )

    if (error) {
      console.error('❌ [API POST /notes] Supabase error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('❌ [API POST /notes] Exception:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


