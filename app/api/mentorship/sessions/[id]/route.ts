import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Detalle de sesión
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

  console.log('🔍 [session] Obteniendo:', id)

  const { data, error } = await supabase
    .from('mentorship_sessions')
    .select(`
      *,
      educator:educator_id (
        id, display_name, slug, avatar_url, type, bio,
        user:user_id (full_name, email)
      ),
      student:student_id (id, full_name, email, avatar_url),
      specialty:specialty_id (id, name, icon, description),
      review:session_reviews (id, rating, comment, created_at),
      notes:session_notes (id, content, created_at)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('❌ [session] No encontrada:', error)
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }

  // Verificar que el usuario es participante
  const educatorUser = data.educator as any
  const isEducator = educatorUser?.user?.id === user.id
  const isStudent = data.student_id === user.id

  if (!isEducator && !isStudent) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  console.log('✅ [session] Encontrada')
  return NextResponse.json({ data })
}

// PUT: Actualizar estado de sesión
export async function PUT(
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
  const { status, meeting_url, cancellation_reason } = body

  console.log('🔍 [session] Actualizando:', id, { status })

  // Obtener sesión actual
  const { data: session } = await supabase
    .from('mentorship_sessions')
    .select(`
      *,
      educator:educator_id (user_id)
    `)
    .eq('id', id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }

  // Verificar permisos
  const educatorData = session.educator as any
  const isEducator = educatorData?.user_id === user.id
  const isStudent = session.student_id === user.id

  if (!isEducator && !isStudent) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Solo educador puede confirmar
  if (status === 'confirmed' && !isEducator) {
    return NextResponse.json({ error: 'Solo el educador puede confirmar' }, { status: 403 })
  }

  // Preparar actualización
  const updateData: Record<string, unknown> = { status }

  if (status === 'confirmed' && meeting_url) {
    updateData.meeting_url = meeting_url
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancelled_by = user.id
    updateData.cancellation_reason = cancellation_reason

    // TODO: Devolver créditos si aplica
  }

  const { data, error } = await supabase
    .from('mentorship_sessions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ [session] Error actualizando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [session] Actualizada:', status)
  return NextResponse.json({ data })
}
