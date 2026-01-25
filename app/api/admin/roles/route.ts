import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRoles } from '@/lib/roles/getUserRoles'
import { UserRole } from '@/types/roles'
import { checkRateLimit } from '@/lib/ratelimit'

// GET - Listar roles de un usuario
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

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
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { isAdmin } = await getUserRoles()

    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, role, notes, bio, headline } = body as {
      user_id: string
      role: UserRole
      notes?: string
      bio?: string
      headline?: string
    }

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id y role son requeridos' },
        { status: 400 }
      )
    }

    // Usar funciones SQL para instructor y mentor (crean registros asociados)
    if (role === 'instructor') {
      const { data, error } = await supabase.rpc('admin_assign_instructor', {
        p_user_id: user_id,
        p_admin_id: user.id,
        p_bio: bio || 'Instructor designado por administración',
        p_headline: headline || null,
        p_reason: notes || 'Designado por admin'
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string; message?: string }
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      console.log('✅ [API/roles] Instructor asignado:', { user_id, result })
      return NextResponse.json({ data: result })
    }

    if (role === 'mentor') {
      const { data, error } = await supabase.rpc('admin_assign_mentor', {
        p_user_id: user_id,
        p_admin_id: user.id,
        p_reason: notes || 'Designado por admin'
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string; message?: string }
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      console.log('✅ [API/roles] Mentor asignado:', { user_id, result })
      return NextResponse.json({ data: result })
    }

    // Para otros roles (admin, beta_tester, etc.), usar inserción directa
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id,
        role,
        granted_by: user.id,
        notes,
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
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { isAdmin } = await getUserRoles()

    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, role, reason, apply_cooldown } = body as {
      user_id: string
      role: UserRole
      reason?: string
      apply_cooldown?: boolean
    }

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

    // Usar funciones SQL para instructor y mentor (desactivan registros asociados)
    if (role === 'instructor') {
      const { data, error } = await supabase.rpc('admin_revoke_instructor', {
        p_user_id: user_id,
        p_admin_id: user.id,
        p_reason: reason || 'Revocado por admin'
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string }
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      console.log('✅ [API/roles] Instructor revocado:', { user_id, result })
      return NextResponse.json({ success: true, data: result })
    }

    if (role === 'mentor') {
      const { data, error } = await supabase.rpc('admin_revoke_mentor', {
        p_user_id: user_id,
        p_admin_id: user.id,
        p_reason: reason || 'Revocado por admin',
        p_apply_cooldown: apply_cooldown !== false  // default true
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string }
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      console.log('✅ [API/roles] Mentor revocado:', { user_id, result })
      return NextResponse.json({ success: true, data: result })
    }

    // Para otros roles, usar actualización directa
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


