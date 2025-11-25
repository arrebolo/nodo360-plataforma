import { getProposals, getCategories, getGovernanceStats } from '@/lib/governance/queries'
import { PROPOSAL_STATUS_INFO, getVotePercentage, hasQuorum } from '@/types/governance'
import Link from 'next/link'
import { Vote, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Gobernanza | Nodo360',
  description: 'Participa en las decisiones de la comunidad Nodo360',
}

export default async function GobernanzaPage() {
  const [activeProposals, categories, stats] = await Promise.all([
    getProposals({ status: ['active', 'pending_review'] }),
    getCategories(),
    getGovernanceStats(),
  ])

  return (
    <div className="min-h-screen bg-[#0a0d14]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-900/20 to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Vote className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Gobernanza</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl">
            Tu voz importa. Participa en las decisiones que dan forma al futuro de Nodo360.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Vote className="w-5 h-5" />}
            label="Propuestas Activas"
            value={stats.activeProposals}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Aprobadas"
            value={stats.passedProposals}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Votos Totales"
            value={stats.totalVotes}
            color="purple"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Participantes"
            value={stats.totalParticipants}
            color="amber"
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/gobernanza/nueva"
            className="px-6 py-3 bg-[#ff6b35] hover:bg-[#ff6b35]/80 rounded-lg font-medium transition-colors text-white"
          >
            Crear Propuesta
          </Link>
          <Link
            href="/gobernanza/mis-propuestas"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors text-white"
          >
            Mis Propuestas
          </Link>
          <Link
            href="/gobernanza/historial"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors text-white"
          >
            Historial
          </Link>
        </div>

        {/* Propuestas Activas */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Propuestas en Votación</h2>

          {activeProposals.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
              <p className="text-gray-400">No hay propuestas activas en este momento.</p>
              <Link
                href="/gobernanza/nueva"
                className="inline-block mt-4 text-[#ff6b35] hover:underline"
              >
                ¿Tienes una idea? ¡Crea una propuesta!
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeProposals.map((proposal) => {
                const statusInfo = PROPOSAL_STATUS_INFO[proposal.status]
                const percentages = getVotePercentage(proposal)
                const quorumMet = hasQuorum(proposal)

                return (
                  <Link
                    key={proposal.id}
                    href={`/gobernanza/${proposal.slug}`}
                    className="block bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          {proposal.category_icon && (
                            <span className="text-sm text-gray-400">
                              {proposal.category_icon} {proposal.category_name}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            proposal.proposal_level === 2
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            Nivel {proposal.proposal_level}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-[#ff6b35] transition-colors">
                          {proposal.title}
                        </h3>
                        <p className="text-gray-400 mt-1 line-clamp-2">
                          {proposal.description}
                        </p>
                      </div>

                      {/* Resultados */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {percentages.for}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {proposal.total_votes} votos
                        </div>
                        {!quorumMet && (
                          <div className="text-xs text-yellow-400 mt-1">
                            Falta quorum
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${percentages.for}%` }}
                      />
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${percentages.against}%` }}
                      />
                      <div
                        className="bg-gray-500 transition-all"
                        style={{ width: `${percentages.abstain}%` }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {proposal.author_avatar && (
                          <img
                            src={proposal.author_avatar}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span>{proposal.author_name || 'Usuario'}</span>
                        <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                          {proposal.author_gpower} gP
                        </span>
                      </div>
                      {proposal.seconds_remaining > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.ceil(proposal.seconds_remaining / 86400)} días restantes
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Categorías */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-white">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/gobernanza?categoria=${category.slug}`}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all text-center"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-medium text-white">{category.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${
                  category.proposal_level === 2
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  Nivel {category.proposal_level}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  }

  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className={`${iconColors[color]} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}
