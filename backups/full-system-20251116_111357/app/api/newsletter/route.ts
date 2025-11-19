import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insertar o actualizar
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          name: name || null,
          is_active: true,
        },
        { onConflict: 'email' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving newsletter subscriber:', error)
      return NextResponse.json(
        { error: 'Error al suscribirse' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: '¡Suscripción exitosa!',
        data
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in newsletter API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
