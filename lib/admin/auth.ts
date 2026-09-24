import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifica que el usuario autenticado sea admin
 * Si no es admin, redirige al dashboard
 */
export async function requireAdmin(returnUrl?: string) {
  console.log('🔍 [requireAdmin] Verificando permisos de admin...')

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    console.log('❌ [requireAdmin] Usuario no autenticado')
    const loginUrl = returnUrl ? `/login?next=${returnUrl}` : '/login'
    redirect(loginUrl)
  }

  console.log('[requireAdmin] Usuario autenticado:', user.id.substring(0, 8) + '...')

  // Obtener rol
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('❌ [requireAdmin] Error al obtener perfil:', profileError)
    redirect('/')
  }

  console.log('🔍 [requireAdmin] Rol del usuario:', profile?.role)

  // Verificar permisos - SOLO admin puede acceder
  if (profile?.role !== 'admin') {
    console.log(`❌ [requireAdmin] Usuario con rol '${profile?.role}' intentó acceder a admin`)
    redirect('/dashboard')
  }

  console.log('✅ [requireAdmin] Permisos de admin verificados')

  return {
    user,
    profile
  }
}

/**
 * Verifica que el usuario sea admin (no instructor)
 */
export async function requireSuperAdmin(redirectTo: string = '/admin') {
  const { user, profile } = await requireAdmin(redirectTo)

  if (profile.role !== 'admin') {
    console.error('❌ [Admin Auth] Requiere rol de super admin')
    redirect('/admin')
  }

  return { user, profile }
}


