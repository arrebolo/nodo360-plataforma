import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

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
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // CON EL SERVICIO. Es la ficha ENTERA de otra persona, y la pide el panel
  // despues de verifyAdmin(). Con la sesion, la politica por funcion de la 123
  // devolveria una fila vacia para cualquier alumno y el panel diria que el
  // usuario no existe.
  const { data: user, error } = await createAdminClient()
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
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

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

  // Una cuenta de administracion no se suspende ni se reactiva desde aqui.
  //
  // Faltaba: el borrado y el cambio de rol si lo comprobaban, la suspension no.
  // Con una sola cuenta admin era inalcanzable, porque lo unico que se podia
  // intentar era suspenderse a si mismo y eso ya lo corta la comprobacion de
  // arriba. Desde que hay una segunda cuenta de administracion si es alcanzable:
  // un admin puede pedir la suspension del otro.
  //
  // El trigger de la 100 lo para igualmente, y eso es lo que de verdad protege
  // la cuenta. Esto esta aqui para que el panel conteste con una explicacion en
  // vez de con un error de base de datos, y para que la regla se lea en el mismo
  // sitio donde se hace la operacion.
  const { data: objetivo } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', id)
    .maybeSingle()

  if ((objetivo as { role: string } | null)?.role === 'admin') {
    return NextResponse.json(
      {
        error:
          'Una cuenta de administración no se suspende ni se reactiva desde el panel. Está bloqueado en la base de datos; solo se puede desde el editor SQL, con el procedimiento de emergencia documentado.',
      },
      { status: 403 }
    )
  }

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
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

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

  // Enclavamiento: el email escrito en el modal tiene que ser el de ESTE id.
  //
  // No es una barrera de seguridad: quien llama controla el cuerpo, y el
  // permiso ya lo da verifyAdmin() mas arriba. Es lo que impide que un id
  // equivocado —un copiar y pegar, un script, la fila de al lado en la tabla—
  // borre a alguien que no se pretendia borrar. El 28/09/2026 desaparecio una
  // cuenta con 31 filas asociadas y no quedo forma de saber si fue esto.
  let confirmEmail: unknown
  try {
    const cuerpo = await req.json()
    confirmEmail = cuerpo?.confirmEmail
  } catch {
    confirmEmail = undefined
  }

  const normalizar = (v: string) => v.trim().toLowerCase()
  if (typeof confirmEmail !== 'string' || !targetUser.email ||
      normalizar(confirmEmail) !== normalizar(targetUser.email)) {
    return NextResponse.json(
      { error: 'Para eliminar la cuenta hay que confirmar su email' },
      { status: 400 }
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
