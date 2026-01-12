import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRoles } from '@/lib/roles/getUserRoles'
import { UserRole } from '@/types/roles'

// GET - Listar roles de un usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { isAdmin } = await getUserRoles()

    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const userId = request.nextUrl.searchParams.get('userId')

    if (userId) {
      // Roles de un usuario específico
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ data })
    } else {
      // Todos los roles
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          user:user_id (id, email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('❌ [API/roles] GET error:', error)
    return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
  }
}

// POST - Asignar rol a usuario
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { isAdmin } = await getUserRoles()

    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, role, notes, expires_at } = body as {
      user_id: string
      role: UserRole
      notes?: string
      expires_at?: string
    }

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id y role son requeridos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id,
        role,
        granted_by: user?.id,
        notes,
        expires_at,
        is_active: true,
      }, {
        onConflict: 'user_id,role'
      })
      .select()
      .single()

    if (error) throw error

    console.log('✅ [API/roles] Rol asignado:', { user_id, role })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ [API/roles] POST error:', error)
    return NextResponse.json({ error: 'Error al asignar rol' }, { status: 500 })
  }
}

// DELETE - Revocar rol
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { isAdmin } = await getUserRoles()

    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, role } = body as { user_id: string; role: UserRole }

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id y role son requeridos' },
        { status: 400 }
      )
    }

    // No permitir revocar el rol 'user' (es el base)
    if (role === 'user') {
      return NextResponse.json(
        { error: 'No se puede revocar el rol de usuario base' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', user_id)
      .eq('role', role)

    if (error) throw error

    console.log('✅ [API/roles] Rol revocado:', { user_id, role })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [API/roles] DELETE error:', error)
    return NextResponse.json({ error: 'Error al revocar rol' }, { status: 500 })
  }
}


