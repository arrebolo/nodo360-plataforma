import { NextRequest, NextResponse } from 'next/server'
import { publishCourse, unpublishCourse, getCoursePublishStatus } from '@/lib/admin/actions'
import { checkRateLimit } from '@/lib/ratelimit'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/courses/[id]/publish
 * Obtiene el estado de publicabilidad del curso
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await context.params
    const check = await getCoursePublishStatus(id)
    return NextResponse.json(check)
  } catch (error) {
    console.error('[API Publish] Error GET:', error)
    return NextResponse.json(
      { error: 'Error al verificar el curso' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/courses/[id]/publish
 * Publica el curso
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const forcePublish = body.force === true

    const result = await publishCourse(id, forcePublish)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API Publish] Error POST:', error)
    return NextResponse.json(
      { error: 'Error al publicar el curso' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/courses/[id]/publish
 * Despublica el curso (vuelve a borrador)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await context.params
    const result = await unpublishCourse(id)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API Publish] Error DELETE:', error)
    return NextResponse.json(
      { error: 'Error al despublicar el curso' },
      { status: 500 }
    )
  }
}
