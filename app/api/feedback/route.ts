import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, userEmail, pageUrl, message } = await request.json()

    if (!message || !userEmail) {
      return NextResponse.json(
        { error: 'Mensaje y email son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el usuario esta autenticado
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Insertar feedback
    const { data, error } = await supabase
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
      console.error('[Feedback API] Error:', error)
      return NextResponse.json(
        { error: 'Error al guardar feedback' },
        { status: 500 }
      )
    }

    console.log('[Feedback API] Feedback guardado:', data.id)

    return NextResponse.json({
      success: true,
      id: data.id
    })

  } catch (error) {
    console.error('[Feedback API] Error:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
