import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Obtener disponibilidad (propia o de un educador)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const educatorId = searchParams.get('educator_id')

  if (educatorId) {
    // Disponibilidad pública de un educador
    const { data, error } = await supabase
      .from('educator_availability')
      .select('*')
      .eq('educator_id', educatorId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  }

  // Mi disponibilidad (requiere auth)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: educator } = await supabase
    .from('educators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!educator) {
    return NextResponse.json({ error: 'No eres educador' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('educator_availability')
    .select('*')
    .eq('educator_id', educator.id)
    .order('day_of_week', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST: Agregar disponibilidad
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { day_of_week, start_time, end_time, timezone } = body

  const { data: educator } = await supabase
    .from('educators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!educator) {
    return NextResponse.json({ error: 'No eres educador' }, { status: 403 })
  }

  console.log('🔍 [availability] Agregando:', { day_of_week, start_time, end_time })

  const { data, error } = await supabase
    .from('educator_availability')
    .insert({
      educator_id: educator.id,
      day_of_week,
      start_time,
      end_time,
      timezone: timezone || 'Europe/Madrid'
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [availability] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [availability] Agregada')
  return NextResponse.json({ data }, { status: 201 })
}

// DELETE: Eliminar disponibilidad
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const availabilityId = searchParams.get('id')

  if (!availabilityId) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  const { data: educator } = await supabase
    .from('educators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!educator) {
    return NextResponse.json({ error: 'No eres educador' }, { status: 403 })
  }

  const { error } = await supabase
    .from('educator_availability')
    .delete()
    .eq('id', availabilityId)
    .eq('educator_id', educator.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
