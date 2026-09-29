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

    // NINGUNA cuenta de administracion cambia de rol desde aqui, ni la propia ni
    // la de otro.
    //
    // Antes solo se protegia la propia —«no puedes quitarte tu rol»—, asi que un
    // admin podia degradar a otro. Con una sola cuenta admin eso es academico;
    // con dos, es la forma mas rapida de quedarse sin ninguna.
    //
    // El trigger de la 100 lo impide en la BASE y no se puede esquivar. Esto esta
    // para que el mensaje sea util en vez de una excepcion con un 500 encima.
    const { data: objetivo } = await createAdminClient()
      .from('users')
      .select('role')
      .eq('id', targetUserId)
      .maybeSingle()

    if (objetivo?.role === 'admin') {
      return NextResponse.json(
        {
          error:
            'El rol de una cuenta de administración no se cambia desde el panel. Está bloqueado en la base de datos; solo se puede desde el editor SQL, con el procedimiento de emergencia documentado.',
        },
        { status: 403 }
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
