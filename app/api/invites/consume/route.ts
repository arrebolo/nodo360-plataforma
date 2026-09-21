import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * POST /api/invites/consume
 * Consume un codigo de invitacion y aplica su rol AL USUARIO DE LA SESION.
 *
 * El usuario NUNCA sale del cuerpo de la peticion: sale de la sesion. Antes se
 * aceptaba un userId del cliente y se escribia users.role con service_role, lo
 * que permitia asignar el rol de una invitacion a cualquier cuenta.
 *
 * Roles que una invitacion puede conceder: ver ROLES_PERMITIDOS. 'admin' y
 * 'council' quedan fuera a proposito y no deben anadirse: conceden control
 * sobre la plataforma y no pueden depender de conocer una cadena de texto.
 */

// Lista blanca. El unico camino de creacion de invitaciones
// (POST /api/admin/invites) fija role: 'student', asi que esto refleja la
// realidad actual. Para admitir otro rol hay que anadirlo aqui a conciencia.
// NUNCA anadir 'admin' ni 'council'.
const ROLES_PERMITIDOS = ['student'] as const

export async function POST(req: Request) {
  // Rate limiting (strict para invites)
  const rateLimitResponse = await checkRateLimit(req, 'strict')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'missing_fields' },
        { status: 400 }
      )
    }

    // 1) El usuario sale de la sesion, nunca del cuerpo
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 2) Leer el invite
    const { data: invite, error: readErr } = await supabaseAdmin
      .from('invites')
      .select('id, expires_at, max_uses, used_count, is_active, role')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (readErr || !invite) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 200 })
    }

    if (!invite.is_active) {
      return NextResponse.json({ ok: false, error: 'inactive' }, { status: 200 })
    }

    const ahora = new Date()
    if (invite.expires_at && ahora >= new Date(invite.expires_at)) {
      return NextResponse.json({ ok: false, error: 'expired' }, { status: 200 })
    }

    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json({ ok: false, error: 'used_up' }, { status: 200 })
    }

    // 3) El rol tiene que estar en la lista blanca
    if (!ROLES_PERMITIDOS.includes(invite.role as typeof ROLES_PERMITIDOS[number])) {
      console.error(
        `[Invites] Codigo ${code} intenta conceder el rol "${invite.role}", que no esta permitido por codigo`
      )
      return NextResponse.json({ ok: false, error: 'role_not_allowed' }, { status: 200 })
    }

    // 4) No degradar a quien ya tiene un rol superior: si un admin o un
    //    instructor consume un codigo de student, perderia sus permisos.
    const { data: perfil } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (perfil && perfil.role !== 'student' && perfil.role !== invite.role) {
      return NextResponse.json({ ok: false, error: 'already_has_role' }, { status: 200 })
    }

    // 5) Consumo ATOMICO por comparacion e intercambio.
    //    El filtro repite las condiciones sobre la fila leida: si otra peticion
    //    consumio el codigo entre el paso 2 y este, used_count ya no coincide,
    //    la sentencia afecta a 0 filas y lo detectamos. Evita el doble consumo
    //    en paralelo sin necesidad de una funcion en la base de datos.
    const newCount = invite.used_count + 1
    const seAgota = newCount >= invite.max_uses

    const { data: actualizado, error: updErr } = await supabaseAdmin
      .from('invites')
      .update({
        used_count: newCount,
        is_active: !seAgota,
      })
      .eq('id', invite.id)
      .eq('used_count', invite.used_count) // <- el cierre optimista
      .eq('is_active', true)
      .select('id')

    if (updErr) {
      console.error('[Invites] Error actualizando invite:', updErr)
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 400 })
    }

    if (!actualizado || actualizado.length === 0) {
      // Otra peticion gano la carrera. El codigo puede haberse agotado.
      return NextResponse.json({ ok: false, error: 'used_up' }, { status: 200 })
    }

    // 6) Aplicar el rol AL USUARIO DE LA SESION
    const { error: roleErr } = await supabaseAdmin
      .from('users')
      .update({ role: invite.role })
      .eq('id', user.id)

    if (roleErr) {
      console.error('[Invites] Error aplicando rol:', roleErr)
      return NextResponse.json({ ok: false, error: 'role_update_failed' }, { status: 500 })
    }

    console.log(
      `[Invites] Codigo ${code} consumido por ${user.id.substring(0, 8)}... Usos: ${newCount}/${invite.max_uses}`
    )

    return NextResponse.json({
      ok: true,
      role: invite.role,
      remaining: Math.max(invite.max_uses - newCount, 0),
    })
  } catch (error) {
    console.error('[Invites] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'server_error' },
      { status: 500 }
    )
  }
}
