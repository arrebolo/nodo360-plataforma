import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCategories } from '@/lib/governance/queries'
import { CreateProposalForm } from './CreateProposalForm'

export const metadata = {
  title: 'Crear Propuesta | Gobernanza | Nodo360',
  description: 'Crea una nueva propuesta para la comunidad',
}

export default async function NuevaPropostaPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/gobernanza/nueva')
  }

  // Obtener datos del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Obtener XP del usuario
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select('total_xp')
    .eq('user_id', user.id)
    .single()

  const userXP = stats?.total_xp || 0
  const userRole = profile?.role || 'student'

  // Verificar requisitos mínimos (50 XP para nivel 1)
  const canCreateLevel1 = userXP >= 50
  const canCreateLevel2 = ['mentor', 'admin', 'council'].includes(userRole)

  // Obtener categorías
  const categories = await getCategories()

  // Calcular gPower
  const { data: gpower } = await supabase.rpc('calculate_gpower', { p_user_id: user.id })

  return (
    <div className="min-h-screen bg-dark-deep">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Crear Propuesta</h1>
          <p className="text-white/60">
            Comparte tu idea con la comunidad Nodo360
          </p>
        </div>

        {/* Info del usuario */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Tu poder de voto</p>
              <p className="text-2xl font-bold text-purple-400">{gpower || 0} gP</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">XP acumulado</p>
              <p className="text-xl font-semibold text-white">{userXP} XP</p>
            </div>
          </div>
        </div>

        {/* Verificar requisitos */}
        {!canCreateLevel1 ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Requisitos no cumplidos
            </h2>
            <p className="text-white/80 mb-4">
              Necesitas al menos <strong>50 XP</strong> para crear propuestas.
            </p>
            <p className="text-white/60">
              Tu XP actual: <strong>{userXP}</strong>
            </p>
            <p className="text-sm text-white/50 mt-4">
              Completa lecciones y cursos para ganar XP.
            </p>
          </div>
        ) : (
          <CreateProposalForm
            categories={categories}
            canCreateLevel2={canCreateLevel2}
            userRole={userRole}
          />
        )}
      </div>
    </div>
  )
}


