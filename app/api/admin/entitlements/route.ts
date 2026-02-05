import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import {
  grantEntitlement,
  revokeEntitlement,
  listEntitlements,
} from '@/lib/billing/entitlements'
import type { EntitlementType } from '@/lib/billing/entitlements'

/**
 * GET /api/admin/entitlements
 * Lista entitlements. Filtros opcionales: ?user_id=, ?type=, ?page=
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

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || undefined
    const type = searchParams.get('type') as EntitlementType | undefined
    const page = parseInt(searchParams.get('page') || '1', 10)

    const result = await listEntitlements({
      userId,
      type: type || undefined,
      activeOnly: true,
      page,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[admin/entitlements] GET error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * POST /api/admin/entitlements
 * Otorga un entitlement.
 * Body: { user_id, type, target_id?, reason?, expires_at? }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, type, target_id, reason, expires_at } = body

    if (!user_id || !type) {
      return NextResponse.json(
        { error: 'user_id y type son requeridos' },
        { status: 400 }
      )
    }

    const validTypes: EntitlementType[] = ['course_access', 'full_platform', 'learning_path_access']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type debe ser uno de: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (type === 'course_access' && !target_id) {
      return NextResponse.json(
        { error: 'target_id (course_id) es requerido para course_access' },
        { status: 400 }
      )
    }

    const result = await grantEntitlement({
      userId: user_id,
      type,
      targetId: target_id || null,
      grantedBy: user.id,
      reason: reason || null,
      expiresAt: expires_at || null,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ entitlement: result.data }, { status: 201 })
  } catch (err) {
    console.error('[admin/entitlements] POST error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/entitlements
 * Revoca un entitlement.
 * Body: { entitlement_id }
 */
export async function DELETE(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { entitlement_id } = body

    if (!entitlement_id) {
      return NextResponse.json(
        { error: 'entitlement_id es requerido' },
        { status: 400 }
      )
    }

    const result = await revokeEntitlement(entitlement_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/entitlements] DELETE error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
