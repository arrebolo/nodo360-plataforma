import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

type PutBody = {
  key: 'xp_rules' | 'level_rules' | 'commission_rates'
  value: unknown
}

/**
 * Whitelist estricta para evitar keys arbitrarias
 */
function isValidKey(key: string): key is PutBody['key'] {
  return key === 'xp_rules' || key === 'level_rules' || key === 'commission_rates'
}

/**
 * GET /api/admin/settings?key=xp_rules
 */
export async function GET(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // 1) Auth + rol (cliente normal)
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()

    if (!auth?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    // 2) Leer key
    const url = new URL(request.url)
    const key = (url.searchParams.get('key') || '').trim()

    if (!isValidKey(key)) {
      return NextResponse.json({ error: 'Key inválida' }, { status: 400 })
    }

    // 3) Admin client SIN tipado estricto (clave)
    const admin = createAdminClient() as any

    const { data, error } = await admin
      .from('system_settings')
      .select('key,value,updated_at,updated_by')
      .eq('key', key)
      .single()

    if (error || !data) {
      return NextResponse.json({
        key,
        value: {},
        exists: false,
      })
    }

    return NextResponse.json({
      ...data,
      exists: true,
    })
  } catch (err) {
    console.error('[Admin][Settings][GET]', err)
    return NextResponse.json(
      { error: 'Error leyendo settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings
 */
export async function PUT(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    // 1) Auth + rol
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()

    if (!auth?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    // 2) Payload
    const body = (await request.json()) as Partial<PutBody>
    if (!body || !isValidKey(body.key!) || body.value === undefined) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // 3) Admin client SIN tipado estricto
    const admin = createAdminClient() as any

    const { data, error } = await admin
      .from('system_settings')
      .upsert(
        {
          key: body.key,
          value: body.value,
          updated_at: new Date().toISOString(),
          updated_by: auth.user.id,
        },
        { onConflict: 'key' }
      )
      .select('key,value,updated_at,updated_by')
      .single()

    if (error) {
      console.error('[Admin][Settings][PUT]', error)
      return NextResponse.json(
        { error: 'Error guardando settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err) {
    console.error('[Admin][Settings][PUT]', err)
    return NextResponse.json(
      { error: 'Error guardando settings' },
      { status: 500 }
    )
  }
}


