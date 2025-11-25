import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Obtener un badge específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: badge, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!badge) {
      return NextResponse.json(
        { error: 'Hito no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ badge })
  } catch (error) {
    console.error('[Admin] Error al obtener hito:', error)
    return NextResponse.json(
      { error: 'Error al obtener hito' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar badge
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
        { error: 'Solo administradores pueden editar hitos' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Actualizar badge (no cambiar order_index ni created_at)
    const { data, error } = await supabase
      .from('badges')
      .update({
        title: body.title,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        category: body.category,
        rarity: body.rarity,
        requirement_type: body.requirement_type,
        requirement_value: body.requirement_value,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ [Admin] Hito actualizado: ${data.title}`)

    return NextResponse.json({ badge: data })
  } catch (error: any) {
    console.error('[Admin] Error al actualizar hito:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar hito' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar badge
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
        { error: 'Solo administradores pueden eliminar hitos' },
        { status: 403 }
      )
    }

    // Verificar que el badge existe
    const { data: badge } = await supabase
      .from('badges')
      .select('title')
      .eq('id', id)
      .single()

    if (!badge) {
      return NextResponse.json(
        { error: 'Hito no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar user_badges asociados primero (si hay)
    await supabase
      .from('user_badges')
      .delete()
      .eq('badge_id', id)

    // Eliminar badge
    const { error } = await supabase
      .from('badges')
      .delete()
      .eq('id', id)

    if (error) throw error

    console.log(`✅ [Admin] Hito eliminado: ${badge.title}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Error al eliminar hito:', error)
    return NextResponse.json(
      { error: 'Error al eliminar hito' },
      { status: 500 }
    )
  }
}
