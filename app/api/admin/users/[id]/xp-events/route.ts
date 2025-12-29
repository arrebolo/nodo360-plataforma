import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, n))
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    // 1) Auth + rol (session client)
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: me, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    const userId = ctx.params.id
    if (!userId) {
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
    }

    const url = new URL(req.url)
    const limit = clampInt(url.searchParams.get('limit'), 50, 1, 200)
    const type = (url.searchParams.get('type') || '').trim()
    const from = (url.searchParams.get('from') || '').trim()
    const to = (url.searchParams.get('to') || '').trim()

    // cursor por created_at + id (para paginación estable)
    const cursorCreatedAt = (url.searchParams.get('cursorCreatedAt') || '').trim()
    const cursorId = (url.searchParams.get('cursorId') || '').trim()

    const admin = createAdminClient()

    let q = admin
      .from('xp_events')
      .select('id,user_id,event_type,xp_amount,description,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)

    if (type) q = q.eq('event_type', type)
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to)

    // paginación: traer "eventos anteriores" al cursor
    if (cursorCreatedAt && cursorId) {
      // (created_at < cursorCreatedAt) OR (created_at = cursorCreatedAt AND id < cursorId)
      q = q.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      )
    }

    const { data, error } = await q

    if (error) {
      console.error('[Admin][XP Events] Error:', error)
      return NextResponse.json({ error: 'Error leyendo eventos de XP' }, { status: 500 })
    }

    const events = data ?? []
    const last = events.length ? events[events.length - 1] : null

    return NextResponse.json({
      events,
      nextCursor: last
        ? { cursorCreatedAt: last.created_at, cursorId: last.id }
        : null
    })
  } catch (e) {
    console.error('[Admin][XP Events] Exception:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
