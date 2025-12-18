// app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/profile
 * Solo para comprobar rápidamente que la ruta existe
 */
export async function GET() {
  return NextResponse.json({ ok: true })
}

/**
 * PATCH /api/profile
 * Actualiza los datos del perfil del usuario autenticado
 */
export async function PATCH(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[API /profile] Usuario no autenticado', authError)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch (e) {
    console.error('[API /profile] Body inválido:', e)
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const {
    full_name,
    avatar_url,
    bio,
    website,
    twitter,
    linkedin,
    github,
  } = body

  console.log('[API /profile] Datos recibidos para actualizar:', {
    full_name,
    avatar_url,
    bio,
    website,
    twitter,
    linkedin,
    github,
  })

  const { error: updateError } = await supabase
    .from('users')
    .update({
      full_name,
      avatar_url,
      bio,
      website,
      twitter,
      linkedin,
      github,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('[API /profile] Error al actualizar users:', updateError)
    return NextResponse.json(
      {
        error: updateError.message || 'No se pudo actualizar el perfil',
        details: updateError,
      },
      { status: 500 }
    )
  }

  // (Opcional) sincronizar metadata de auth
  try {
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: full_name || undefined,
        avatar_url: avatar_url || undefined,
      },
    })

    if (authUpdateError) {
      console.warn('[API /profile] No se pudo actualizar metadata de auth:', authUpdateError)
    }
  } catch (e) {
    console.warn('[API /profile] Excepción al actualizar metadata de auth:', e)
  }

  return NextResponse.json({ success: true })
}
