import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/instructor/referral/[id]
 * Elimina un enlace de referido
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: linkId } = await params

    // Verificar que el enlace pertenece al usuario
    const { data: link } = await supabase
      .from('referral_links')
      .select('id, instructor_id')
      .eq('id', linkId)
      .single()

    if (!link) {
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 })
    }

    // Verificar permisos (admin puede eliminar cualquiera)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && link.instructor_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este enlace' }, { status: 403 })
    }

    // Eliminar enlace (cascade eliminará clicks y conversiones)
    const { error } = await supabase
      .from('referral_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      console.error('❌ [referral] Error eliminando enlace:', error)
      return NextResponse.json({ error: 'Error al eliminar enlace' }, { status: 500 })
    }

    console.log(`✅ [referral] Enlace ${linkId} eliminado por ${user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [referral] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/instructor/referral/[id]
 * Actualiza un enlace de referido (activar/desactivar)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: linkId } = await params
    const body = await request.json()

    // Verificar que el enlace pertenece al usuario
    const { data: link } = await supabase
      .from('referral_links')
      .select('id, instructor_id')
      .eq('id', linkId)
      .single()

    if (!link) {
      return NextResponse.json({ error: 'Enlace no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && link.instructor_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para editar este enlace' }, { status: 403 })
    }

    // Campos actualizables
    const updates: Record<string, any> = {}
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
    if (body.utm_source !== undefined) updates.utm_source = body.utm_source
    if (body.utm_medium !== undefined) updates.utm_medium = body.utm_medium
    if (body.utm_campaign !== undefined) updates.utm_campaign = body.utm_campaign

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('referral_links')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single()

    if (error) {
      console.error('❌ [referral] Error actualizando enlace:', error)
      return NextResponse.json({ error: 'Error al actualizar enlace' }, { status: 500 })
    }

    console.log(`✅ [referral] Enlace ${linkId} actualizado por ${user.id}`)

    return NextResponse.json({
      success: true,
      link: updated,
    })
  } catch (error) {
    console.error('❌ [referral] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
