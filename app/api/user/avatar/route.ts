import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { avatar_url } = await request.json()

    // Actualizar en BD
    const { error } = await supabase
      .from('users')
      .update({ avatar_url })
      .eq('id', user.id)

    if (error) {
      console.error('Error al actualizar avatar:', error)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, avatar_url })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}


