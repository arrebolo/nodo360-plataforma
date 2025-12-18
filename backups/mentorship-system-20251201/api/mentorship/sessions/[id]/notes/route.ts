import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Obtener notas de la sesión
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params

  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST: Crear nota
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { content, attachments } = body

  console.log('🔍 [notes] Creando nota para sesión:', id)

  const { data, error } = await supabase
    .from('session_notes')
    .insert({
      session_id: id,
      user_id: user.id,
      content,
      attachments: attachments || []
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [notes] Nota creada')
  return NextResponse.json({ data }, { status: 201 })
}
