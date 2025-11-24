import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BadgeDisplay from '@/components/gamification/BadgeDisplay'
import UserLevel from '@/components/gamification/UserLevel'

export const metadata = {
  title: 'Mis Badges | Nodo360',
  description: 'Todos tus badges y logros desbloqueados'
}

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      {/* Fondo animado */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#1a1f2e] via-[#2a2844] to-[#1a1f2e] animate-gradient" />

      {/* Contenido */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>

          <h1 className="text-4xl font-bold mb-2">🏅 Mis Badges</h1>
          <p className="text-white/60">
            Todos los logros que has desbloqueado en tu viaje de aprendizaje
          </p>
        </div>

        {/* User Level Overview */}
        <div className="mb-12">
          <UserLevel variant="card" />
        </div>

        {/* All Badges */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Todos tus badges</h2>
          <BadgeDisplay variant="grid" />
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3">💡 ¿Cómo desbloquear más badges?</h3>
          <ul className="space-y-2 text-white/70">
            <li>✅ Completa lecciones para ganar XP y badges de progreso</li>
            <li>📚 Termina cursos completos para badges especiales</li>
            <li>🔥 Mantén tu racha diaria para badges de constancia</li>
            <li>⭐ Alcanza niveles altos para badges de maestría</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
