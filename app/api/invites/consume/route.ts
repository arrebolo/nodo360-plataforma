import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json()

    if (!code || !userId) {
      return NextResponse.json(
        { ok: false, error: 'missing_fields' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1) Leer invite actual
    const { data: invite, error: readErr } = await supabaseAdmin
      .from('invites')
      .select('id, expires_at, max_uses, used_count, is_active, role')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (readErr || !invite) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 200 }
      )
    }

    if (!invite.is_active) {
      return NextResponse.json(
        { ok: false, error: 'inactive' },
        { status: 200 }
      )
    }

    const now = new Date()
    if (invite.expires_at && now >= new Date(invite.expires_at)) {
      return NextResponse.json(
        { ok: false, error: 'expired' },
        { status: 200 }
      )
    }

    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json(
        { ok: false, error: 'used_up' },
        { status: 200 }
      )
    }

    // 2) Incrementar uso
    const newCount = invite.used_count + 1
    const shouldDeactivate = newCount >= invite.max_uses

    const { error: updErr } = await supabaseAdmin
      .from('invites')
      .update({
        used_count: newCount,
        is_active: shouldDeactivate ? false : true,
      })
      .eq('id', invite.id)

    if (updErr) {
      console.error('[Invites] Error updating invite:', updErr)
      return NextResponse.json(
        { ok: false, error: updErr.message },
        { status: 400 }
      )
    }

    // 3) Aplicar rol al usuario
    await supabaseAdmin
      .from('users')
      .update({ role: invite.role })
      .eq('id', userId)

    console.log(`[Invites] Codigo ${code} consumido por ${userId}. Usos: ${newCount}/${invite.max_uses}`)

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
