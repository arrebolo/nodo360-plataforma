'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Redirige al usuario después del login según su rol
 * - Admin/Instructor → /admin/cursos
 * - Usuario normal → /dashboard
 * - Si hay parámetro 'next' → usa ese
 */
export async function redirectAfterLogin(next?: string) {
  console.log('🔍🔍🔍 [redirectAfterLogin] ===== INICIANDO REDIRECT LOGIC ===== 🔍🔍🔍')

  const supabase = await createClient()

  // Obtener usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('❌ [redirectAfterLogin] No hay usuario autenticado')
    console.log('❌ Error:', authError)
    redirect('/login')
  }

  console.log('[redirectAfterLogin] Usuario autenticado:', user.id.substring(0, 8) + '...')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('❌ [redirectAfterLogin] NO SE PUDO LEER EL PERFIL')
    console.error('   - Error:', profileError)
    console.error('   - Verifica RLS en Supabase!')

    // Redirigir a login con error visible
    redirect('/login?error=sin_perfil_rls')
  }

  console.log('✅ [redirectAfterLogin] Perfil encontrado:')
  console.log('   - Nombre:', profile.full_name)
  console.log('   - Rol:', profile.role)

  // SI HAY PARÁMETRO NEXT, USARLO
  if (next && next !== '/') {
    console.log('↪️ [redirectAfterLogin] Usando parámetro next:', next)
    redirect(next)
  }

  // REDIRIGIR SEGÚN ROL
  const isAdmin = profile.role === 'admin' || profile.role === 'instructor'

  console.log('🎯 [redirectAfterLogin] Decisión de redirect:')
  console.log('   - Es admin/instructor:', isAdmin)
  console.log('   - Rol exacto:', profile.role)

  if (isAdmin) {
    console.log('👑👑👑 [redirectAfterLogin] REDIRIGIENDO A /admin/cursos 👑👑👑')
    redirect('/admin/cursos')
  }

  console.log('👤 [redirectAfterLogin] Redirigiendo a /dashboard')
  redirect('/dashboard')
}


