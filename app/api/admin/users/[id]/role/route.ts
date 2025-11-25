import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Verificar que el usuario actual es admin
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
        { error: 'Solo administradores pueden cambiar roles' },
        { status: 403 }
      )
    }

    const { role } = await request.json()

    // Validar que el rol es válido
    if (!['student', 'instructor', 'mentor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    console.log(`✅ [Admin] Rol cambiado para usuario ${id} a ${role}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Error al cambiar rol:', error)
    return NextResponse.json(
      { error: 'Error al cambiar rol' },
      { status: 500 }
    )
  }
}
