import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

// GET - Listar invitaciones
export async function GET(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const user = await verifyAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invites: data })
}

// POST - Crear invitación
export async function POST(req: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const user = await verifyAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code, expiresInHours, maxUses, notes } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const expiresAt = expiresInHours > 0
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null

    const { data, error } = await supabaseAdmin
      .from('invites')
      .insert({
        code: code.toUpperCase(),
        expires_at: expiresAt,
        max_uses: maxUses || 50,
        notes: notes || null,
        created_by: user.id,
        role: 'student',
      })
      .select()
      .single()

    if (error) {
      console.error('[Admin Invites] Error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Este código ya existe' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Admin Invites] Codigo creado: ${code}`)
    return NextResponse.json({ success: true, invite: data })

  } catch (error) {
    console.error('[Admin Invites] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// PATCH - Activar/Desactivar invitación
export async function PATCH(req: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const user = await verifyAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, is_active } = await req.json()

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('invites')
      .update({ is_active })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Admin Invites] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar invitación
export async function DELETE(req: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const user = await verifyAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await req.json()

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('invites')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Admin Invites] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
