import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Listar todos los badges
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json({ badges: data })
  } catch (error) {
    console.error('[Admin] Error al obtener hitos:', error)
    return NextResponse.json(
      { error: 'Error al obtener hitos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo badge
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear hitos' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Obtener el último order_index
    const { data: lastBadge } = await supabase
      .from('badges')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newOrderIndex = (lastBadge?.order_index || 0) + 1

    const { data, error } = await supabase
      .from('badges')
      .insert({
        ...body,
        order_index: newOrderIndex,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ [Admin] Hito creado: ${data.title}`)

    return NextResponse.json({ badge: data })
  } catch (error: any) {
    console.error('[Admin] Error al crear hito:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear hito' },
      { status: 500 }
    )
  }
}
