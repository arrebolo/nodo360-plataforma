import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Mis sesiones (como alumno o educador)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') || 'student' // 'student' | 'educator'
  const status = searchParams.get('status') // 'pending' | 'confirmed' | 'completed' | 'cancelled'

  console.log('🔍 [sessions] Listando sesiones:', { userId: user.id, role, status })

  let query = supabase
    .from('mentorship_sessions')
    .select(`
      *,
      educator:educator_id (
        id, display_name, slug, avatar_url, type,
        user:user_id (full_name)
      ),
      student:student_id (id, full_name, avatar_url),
      specialty:specialty_id (id, name, icon)
    `)
    .order('scheduled_at', { ascending: true })

  if (role === 'educator') {
    // Obtener mi perfil de educador primero
    const { data: myEducator } = await supabase
      .from('educators')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!myEducator) {
      return NextResponse.json({ error: 'No eres educador' }, { status: 403 })
    }

    query = query.eq('educator_id', myEducator.id)
  } else {
    query = query.eq('student_id', user.id)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [sessions] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [sessions] Encontradas:', data?.length || 0)
  return NextResponse.json({ data })
}

// POST: Crear sesión (solicitar al educador)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const {
    educator_id,
    session_type,
    scheduled_at,
    duration_minutes,
    title,
    description,
    specialty_id,
    is_free_intro
  } = body

  console.log('🔍 [sessions] Creando sesión:', {
    studentId: user.id,
    educatorId: educator_id,
    type: session_type
  })

  // Verificar que el educador existe y está disponible
  const { data: educator, error: educatorError } = await supabase
    .from('educators')
    .select('id, hourly_rate_credits, offers_free_intro, free_intro_minutes')
    .eq('id', educator_id)
    .eq('status', 'active')
    .eq('is_available', true)
    .single()

  if (educatorError || !educator) {
    return NextResponse.json({ error: 'Educador no disponible' }, { status: 400 })
  }

  // Calcular precio
  let payment_type = 'credits'
  let price_credits = 0
  let actualDuration = duration_minutes || 60

  if (is_free_intro && educator.offers_free_intro) {
    payment_type = 'free'
    price_credits = 0
    actualDuration = educator.free_intro_minutes || 10
  } else {
    price_credits = Math.ceil((actualDuration / 60) * educator.hourly_rate_credits)

    // Verificar créditos del usuario
    const { data: credits } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (!credits || credits.balance < price_credits) {
      return NextResponse.json({
        error: 'Créditos insuficientes',
        required: price_credits,
        available: credits?.balance || 0
      }, { status: 400 })
    }
  }

  // Crear sesión
  const { data: session, error } = await supabase
    .from('mentorship_sessions')
    .insert({
      educator_id,
      student_id: user.id,
      session_type,
      status: 'pending',
      scheduled_at,
      duration_minutes: actualDuration,
      payment_type,
      price_credits,
      is_free_intro: is_free_intro && educator.offers_free_intro,
      title,
      description,
      specialty_id
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [sessions] Error creando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [sessions] Sesión creada:', session.id)
  return NextResponse.json({ data: session }, { status: 201 })
}
