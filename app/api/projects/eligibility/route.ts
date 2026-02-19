import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { checkProjectEligibility } from '@/lib/projects/eligibility'

/**
 * GET /api/projects/eligibility
 * Verificar si el usuario puede crear proyectos
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const eligibility = await checkProjectEligibility(user.id)

    return NextResponse.json({
      success: true,
      data: eligibility,
    })
  } catch (error) {
    console.error('[GET /api/projects/eligibility] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
