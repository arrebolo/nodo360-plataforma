import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'

/**
 * Dashboard Header (Server Component)
 * Verifica autenticación y muestra información del usuario
 */
export async function DashboardHeader() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('🔍 [DashboardHeader] Verificando usuario autenticado')

  // Si no hay usuario, redirigir a login
  if (error || !user) {
    console.log('❌ [DashboardHeader] Usuario no autenticado, redirigiendo a /login')
    redirect('/login')
  }

  console.log('✅ [DashboardHeader] Usuario autenticado:', user.email)

  // Obtener nombre completo del metadata o usar email
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Estudiante'

  return (
    <div className="bg-gradient-to-b from-[#252b3d] to-[#1a1f2e] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              ¡Hola, {userName}! 👋
            </h1>
            <p className="text-white/60 text-sm">
              {user.email}
            </p>
            <p className="text-white/40 text-xs mt-1">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de logout */}
            <LogoutButton variant="default" />
          </div>
        </div>
      </div>
    </div>
  )
}
