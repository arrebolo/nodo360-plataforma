import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastAnnouncement } from '@/lib/notifications'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // Rate limiting estricto para operaciones admin
  const rateLimitResponse = await checkRateLimit(request, 'strict')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener datos del body
    const { title, message, link, channels } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Enviar anuncio
    await broadcastAnnouncement(title, message, link, {
      inApp: channels?.inApp ?? true,
      discord: channels?.discord ?? true,
      telegram: channels?.telegram ?? true,
    })

    console.log('[Admin Announcements] Anuncio enviado:', { title, channels })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Announcements] Error:', error)
    return NextResponse.json(
      { error: 'Error al enviar anuncio' },
      { status: 500 }
    )
  }
}
