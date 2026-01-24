import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mentor/apply
 * Verifica si el usuario puede aplicar a mentor
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Llamar a can_apply_mentor (retorna JSONB)
    const { data: result, error } = await supabase
      .rpc('can_apply_mentor', { p_user_id: user.id })

    if (error) {
      console.error('[mentor/apply] ❌ Error verificando elegibilidad:', error)
      return NextResponse.json({ error: 'Error al verificar elegibilidad' }, { status: 500 })
    }

    console.log(`[mentor/apply] ✅ Elegibilidad verificada para usuario ${user.id}: ${result?.can_apply ? 'puede' : 'no puede'}`)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[mentor/apply] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

interface MentorApplicationRequest {
  motivation: string
  experience?: string
}

/**
 * POST /api/mentor/apply
 * Envía una aplicación para ser mentor
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body: MentorApplicationRequest = await request.json()
    const { motivation, experience } = body

    // Validar campos requeridos
    if (!motivation || motivation.trim().length < 50) {
      return NextResponse.json(
        { error: 'La motivación debe tener al menos 50 caracteres' },
        { status: 400 }
      )
    }

    // Llamar a submit_mentor_application (retorna JSONB)
    const { data: result, error } = await supabase
      .rpc('submit_mentor_application', {
        p_user_id: user.id,
        p_motivation: motivation.trim(),
        p_experience: experience?.trim() || null,
      })

    if (error) {
      console.error('[mentor/apply] ❌ Error enviando aplicación:', error)
      return NextResponse.json({ error: 'Error al enviar la aplicación' }, { status: 500 })
    }

    // La función retorna JSONB con success/error o success/application_id
    if (!result?.success) {
      console.log(`[mentor/apply] ⚠️ Aplicación rechazada para usuario ${user.id}: ${result?.reason || result?.error}`)
      return NextResponse.json({
        success: false,
        error: result?.reason || result?.error || 'No se pudo enviar la aplicación',
      }, { status: 400 })
    }

    console.log(`[mentor/apply] ✅ Aplicación enviada: usuario ${user.id}, id ${result.application_id}, método ${result.decision_method}`)

    return NextResponse.json({
      success: true,
      application_id: result.application_id,
      decision_method: result.decision_method,
      message: result.message,
    }, { status: 201 })
  } catch (error) {
    console.error('[mentor/apply] ❌ Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
