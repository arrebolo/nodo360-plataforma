// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get('lessonId')

  if (!lessonId) {
    return NextResponse.json(
      { error: 'lessonId es obligatorio' },
      { status: 400 },
    )
  }

  // Filtrar por usuario para seguridad
  const { data, error } = await supabase
    .from('user_notes')
    .select('id, note_text, updated_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[API /notes] Error GET:', error)
    return NextResponse.json(
      { error: 'Error al cargar notas' },
      { status: 500 },
    )
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => null)
  const lessonId = body?.lesson_id as string | undefined
  const noteText = (body?.note_text as string | undefined) ?? ''

  if (!lessonId) {
    return NextResponse.json(
      { error: 'lesson_id es obligatorio' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('user_notes')
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      note_text: noteText,
    })
    .select('id, note_text')
    .single()

  if (error) {
    console.error('[API /notes] Error INSERT:', error)
    return NextResponse.json(
      { error: 'Error al crear nota' },
      { status: 500 },
    )
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => null)
  const id = body?.id as string | undefined
  const noteText = body?.note_text as string | undefined

  if (!id) {
    return NextResponse.json(
      { error: 'id es obligatorio' },
      { status: 400 },
    )
  }

  // Verificar que la nota pertenece al usuario
  const { data, error } = await supabase
    .from('user_notes')
    .update({
      note_text: noteText ?? '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id) // Seguridad: solo puede editar sus propias notas
    .select('id, note_text')
    .single()

  if (error) {
    console.error('[API /notes] Error UPDATE:', error)
    return NextResponse.json(
      { error: 'Error al actualizar nota' },
      { status: 500 },
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => null)
  const id = body?.id as string | undefined

  if (!id) {
    return NextResponse.json(
      { error: 'id es obligatorio' },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('user_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Seguridad: solo puede eliminar sus propias notas

  if (error) {
    console.error('[API /notes] Error DELETE:', error)
    return NextResponse.json(
      { error: 'Error al eliminar nota' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
