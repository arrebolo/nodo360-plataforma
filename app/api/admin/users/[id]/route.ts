import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Verificar que es admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null

  return user
}

// GET - Obtener usuario específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user })
}

// PATCH - Suspender/Reactivar usuario
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action, reason } = await req.json()

  // No permitir auto-suspensión
  if (id === admin.id) {
    return NextResponse.json(
      { error: 'No puedes suspender tu propia cuenta' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  if (action === 'suspend') {
    // Suspender usuario
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: reason || 'Suspendido por administrador',
        suspended_by: admin.id,
      })
      .eq('id', id)

    if (error) {
      console.error('[Admin Users] Error suspending:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Admin Users] Usuario ${id} suspendido por ${admin.id}`)
    return NextResponse.json({ success: true, message: 'Usuario suspendido' })

  } else if (action === 'reactivate') {
    // Reactivar usuario
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_reason: null,
        suspended_by: null,
      })
      .eq('id', id)

    if (error) {
      console.error('[Admin Users] Error reactivating:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Admin Users] Usuario ${id} reactivado por ${admin.id}`)
    return NextResponse.json({ success: true, message: 'Usuario reactivado' })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}

// DELETE - Eliminar usuario permanentemente
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // No permitir auto-eliminación
  if (id === admin.id) {
    return NextResponse.json(
      { error: 'No puedes eliminar tu propia cuenta' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  // Verificar que el usuario existe y no es admin
  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('role, email')
    .eq('id', id)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (targetUser.role === 'admin') {
    return NextResponse.json(
      { error: 'No puedes eliminar a otro administrador' },
      { status: 403 }
    )
  }

  // Eliminar de auth.users (esto cascadea a public.users por FK)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (authError) {
    console.error('[Admin Users] Error deleting auth user:', authError)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  console.log(`[Admin Users] Usuario ${id} (${targetUser.email}) eliminado por ${admin.id}`)
  return NextResponse.json({ success: true, message: 'Usuario eliminado permanentemente' })
}
