import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit, getClientIP, rateLimitExceeded } from '@/lib/ratelimit'

export async function POST(request: Request) {
  // Rate limiting estricto para formulario público
  const ip = getClientIP(request)
  const { success } = await rateLimit(ip, 'strict')

  if (!success) {
    console.log('[Mentorship] Rate limit excedido para IP:', ip.substring(0, 8) + '***')
    return rateLimitExceeded()
  }

  try {
    const body = await request.json()
    const { full_name, email, goal, message } = body

    // Validación básica
    if (!full_name || !email || !goal) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert([
        {
          full_name,
          email,
          goal,
          message: message || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error saving mentorship request:', error)
      return NextResponse.json(
        { error: 'Error al guardar solicitud' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitud enviada correctamente',
        data
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in mentorship API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


