import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCertificate } from '@/lib/certificates/createCertificate'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'courseId es requerido' }, { status: 400 })
    }

    const result = await createCertificate({
      userId: user.id,
      courseId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      certificate: result.certificate,
      alreadyExists: result.alreadyExists || false,
    })
  } catch (err) {
    console.error('[API/certificates/generate] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
