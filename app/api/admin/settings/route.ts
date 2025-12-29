import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type PutBody = {
  key: string
  value: unknown
}

function isValidKey(key: string) {
  // Whitelist para evitar que un admin cree settings arbitrarios sin control.
  return key === 'xp_rules' || key === 'level_rules'
}

export async function GET(request: Request) {
  try {
    // 1) Session client: auth + rol
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: me, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    const url = new URL(request.url)
    const key = (url.searchParams.get('key') || '').trim()

    if (!isValidKey(key)) {
      return NextResponse.json({ error: 'Key inválida' }, { status: 400 })
    }

    // 2) Admin client: lectura sin RLS
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('system_settings')
      .select('key,value,updated_at,updated_by')
      .eq('key', key)
      .single()

    if (error) {
      // Si no existe, devolvemos un default vacío
      return NextResponse.json({ key, value: {}, exists: false })
    }

    return NextResponse.json({ ...data, exists: true })
  } catch (err) {
    console.error('[Admin][Settings][GET] Error:', err)
    return NextResponse.json({ error: 'Error leyendo settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // 1) Session client: auth + rol
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: me, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
    }

    // 2) Payload
    const body = (await request.json()) as Partial<PutBody>
    const key = typeof body.key === 'string' ? body.key.trim() : ''
    const value = body.value

    if (!isValidKey(key) || value === undefined) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // 3) Admin client: upsert
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('system_settings')
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: authData.user.id,
        },
        { onConflict: 'key' }
      )
      .select('key,value,updated_at,updated_by')
      .single()

    if (error) {
      console.error('[Admin][Settings][PUT] Error upsert:', error)
      return NextResponse.json({ error: 'Error guardando settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[Admin][Settings][PUT] Error:', err)
    return NextResponse.json({ error: 'Error guardando settings' }, { status: 500 })
  }
}
