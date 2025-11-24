import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Leaderboard from '@/components/gamification/Leaderboard'
import UserLevel from '@/components/gamification/UserLevel'

export const metadata = {
  title: 'Leaderboard | Nodo360',
  description: 'Ranking de los mejores estudiantes'
}

export default async function LeaderboardPage() {
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

          <h1 className="text-4xl font-bold mb-2">🏆 Leaderboard Global</h1>
          <p className="text-white/60">
            Compite con otros estudiantes y sube en el ranking
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - User Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <UserLevel variant="card" />

              {/* Tips Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">💡 Sube en el ranking</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>✅ Completa lecciones (+10 XP cada una)</li>
                  <li>📚 Termina cursos (+50-300 XP)</li>
                  <li>🏅 Desbloquea badges (+5-500 XP)</li>
                  <li>🔥 Mantén tu racha diaria (+25-200 XP)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content - Leaderboard */}
          <div className="lg:col-span-2">
            <Leaderboard limit={100} showCurrentUser={true} variant="full" />
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3">🎯 ¿Cómo funciona el ranking?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/70">
            <div>
              <h4 className="text-white font-medium mb-2">Criterios de Ordenamiento</h4>
              <ul className="space-y-1 text-sm">
                <li>1. XP Total (mayor a menor)</li>
                <li>2. Nivel Actual (mayor a menor)</li>
                <li>3. Fecha de registro (primero en llegar)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Actualizaciones</h4>
              <ul className="space-y-1 text-sm">
                <li>• Ranking en tiempo real</li>
                <li>• XP actualizado al instante</li>
                <li>• Posición recalculada automáticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
