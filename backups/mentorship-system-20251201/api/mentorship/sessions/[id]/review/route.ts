import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST: Valorar sesión (solo alumno, solo sesiones completadas)
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
  const { rating, comment } = body

  console.log('🔍 [review] Creando valoración:', { sessionId: id, rating })

  // Verificar sesión
  const { data: session } = await supabase
    .from('mentorship_sessions')
    .select('id, student_id, educator_id, status')
    .eq('id', id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }

  if (session.student_id !== user.id) {
    return NextResponse.json({ error: 'Solo el alumno puede valorar' }, { status: 403 })
  }

  if (session.status !== 'completed') {
    return NextResponse.json({ error: 'Solo puedes valorar sesiones completadas' }, { status: 400 })
  }

  // Verificar que no existe ya
  const { data: existing } = await supabase
    .from('session_reviews')
    .select('id')
    .eq('session_id', id)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya has valorado esta sesión' }, { status: 400 })
  }

  // Crear review
  const { data: review, error } = await supabase
    .from('session_reviews')
    .insert({
      session_id: id,
      reviewer_id: user.id,
      rating,
      comment
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [review] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Actualizar rating promedio del educador
  const { data: stats } = await supabase
    .from('session_reviews')
    .select('rating')
    .eq('session_id.educator_id', session.educator_id)

  if (stats && stats.length > 0) {
    const avgRating = stats.reduce((sum, r) => sum + r.rating, 0) / stats.length

    await supabase
      .from('educators')
      .update({
        rating_avg: avgRating.toFixed(2),
        total_reviews: stats.length
      })
      .eq('id', session.educator_id)
  }

  console.log('✅ [review] Valoración creada')
  return NextResponse.json({ data: review }, { status: 201 })
}
