import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAccessGrantedEmail } from '@/lib/email/send-access-granted'
import { checkRateLimit } from '@/lib/ratelimit'

// Verificar que es admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null

  return user
}

// POST - Cambiar estado beta de un usuario
export async function POST(req: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, enabled } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Obtener datos del usuario
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role, email, full_name, wants_beta_notification')
      .eq('id', userId)
      .single()

    if (targetUser?.role === 'admin' && !enabled) {
      return NextResponse.json(
        { error: 'No puedes desactivar el acceso beta de un administrador' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_beta: enabled })
      .eq('id', userId)

    if (error) {
      console.error('[Admin Beta] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enviar email si se habilito beta y el usuario quiere ser notificado
    let emailSent = false
    if (enabled && targetUser?.wants_beta_notification && targetUser?.email) {
      try {
        await sendAccessGrantedEmail(targetUser.email, targetUser.full_name || 'Usuario')
        emailSent = true
        console.log('[Admin Beta] Email enviado a:', targetUser.email)
      } catch (emailError) {
        console.error('[Admin Beta] Error enviando email (no critico):', emailError)
      }
    }

    console.log(`[Admin Beta] Usuario ${userId} - beta: ${enabled} (por ${admin.id})`)
    return NextResponse.json({
      success: true,
      message: enabled ? 'Acceso beta habilitado' : 'Acceso beta deshabilitado',
      emailSent
    })

  } catch (error) {
    console.error('[Admin Beta] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// PATCH - Habilitar beta masivamente
export async function PATCH(req: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(req, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userIds, enabled } = await req.json()

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds debe ser un array' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { error, count } = await supabaseAdmin
      .from('users')
      .update({ is_beta: enabled })
      .in('id', userIds)
      .neq('role', 'admin') // No afectar admins

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Admin Beta] ${userIds.length} usuarios actualizados - beta: ${enabled}`)
    return NextResponse.json({
      success: true,
      message: `${userIds.length} usuarios actualizados`,
      count
    })

  } catch (error) {
    console.error('[Admin Beta] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// GET - Obtener estadisticas de usuarios beta
export async function GET(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()

    // Contar usuarios con y sin beta
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('is_beta, role')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = {
      total: users?.length || 0,
      withBeta: users?.filter(u => u.is_beta).length || 0,
      withoutBeta: users?.filter(u => !u.is_beta).length || 0,
      admins: users?.filter(u => u.role === 'admin').length || 0,
      instructors: users?.filter(u => u.role === 'instructor').length || 0,
      students: users?.filter(u => u.role === 'student').length || 0,
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('[Admin Beta] Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
