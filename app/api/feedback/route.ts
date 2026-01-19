import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // Rate limiting (strict para feedback)
  const rateLimitResponse = await checkRateLimit(request, 'strict')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { userId, userEmail, pageUrl, message } = await request.json()
    console.log('[Feedback API] Recibido:', { userId, userEmail, pageUrl, messageLength: message?.length })

    if (!message || !userEmail) {
      console.log('[Feedback API] Datos incompletos')
      return NextResponse.json(
        { error: 'Mensaje y email son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el usuario esta autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Feedback API] Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('[Feedback API] Usuario no autenticado')
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('[Feedback API] Usuario autenticado:', user.id)

    // Usar admin client para bypass RLS
    const supabaseAdmin = createAdminClient()

    // Insertar feedback
    const { data, error } = await supabaseAdmin
      .from('beta_feedback')
      .insert({
        user_id: userId || user.id,
        user_email: userEmail,
        page_url: pageUrl,
        message: message
      })
      .select()
      .single()

    if (error) {
      console.error('[Feedback API] Error al insertar:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Error al guardar feedback', details: error.message },
        { status: 500 }
      )
    }

    console.log('[Feedback API] ✅ Feedback guardado:', data.id)

    return NextResponse.json({
      success: true,
      id: data.id
    })

  } catch (error) {
    console.error('[Feedback API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
