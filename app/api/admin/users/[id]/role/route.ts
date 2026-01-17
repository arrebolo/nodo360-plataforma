import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id: targetUserId } = await params
    const { role } = await request.json()

    // Validar rol
    const validRoles = ['student', 'instructor', 'mentor', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    // Verificar autenticación y que el usuario actual es admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
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

    // Prevenir que un admin se quite su propio rol
    if (targetUserId === user.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'No puedes quitarte tu propio rol de administrador' },
        { status: 400 }
      )
    }

    // Usar cliente admin (service_role) para bypass RLS
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select('id, role')
      .single()

    if (error) {
      console.error('❌ [Admin] Error al cambiar rol:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el rol' },
        { status: 500 }
      )
    }

    console.log(`✅ [Admin] Rol cambiado: ${targetUserId} → ${role}`)

    return NextResponse.json({
      success: true,
      data,
      message: 'Rol actualizado correctamente'
    })
  } catch (error) {
    console.error('❌ [Admin] Error en cambio de rol:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// También soportar PATCH como alias
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  return PUT(request, context)
}
