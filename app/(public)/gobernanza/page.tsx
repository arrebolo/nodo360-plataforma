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
    <div className="min-h-screen bg-dark">
      {/* Hero con gradiente brand sutil */}
      <div className="bg-gradient-to-b from-brand/10 via-transparent to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand/20 rounded-xl">
              <Vote className="w-8 h-8 text-brand-light" />
            </div>
            <h1 className="text-4xl font-bold text-white">Gobernanza</h1>
          </div>
          <p className="text-xl text-white/70 max-w-2xl">
            Tu voz importa. Participa en las decisiones que dan forma al futuro de Nodo360.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats - UNIFICADOS con mismo fondo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Vote className="w-5 h-5" />}
            label="Propuestas Activas"
            value={stats.activeProposals}
            iconColor="text-brand-light"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Aprobadas"
            value={stats.passedProposals}
            iconColor="text-success"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Votos Totales"
            value={stats.totalVotes}
            iconColor="text-accent-blue"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Participantes"
            value={stats.totalParticipants}
            iconColor="text-warning"
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/gobernanza/nueva"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-95 hover:shadow-lg hover:shadow-brand/20 transition-colors"
          >
            Crear Propuesta
          </Link>
          <Link
            href="/gobernanza/mis-propuestas"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-white/10 border border-dark-border hover:bg-white/15 transition-colors"
          >
            Mis Propuestas
          </Link>
          <Link
            href="/gobernanza/historial"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-10 px-4 text-sm text-white bg-white/10 border border-dark-border hover:bg-white/15 transition-colors"
          >
            Historial
          </Link>
        </div>

        {/* Propuestas Activas */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Propuestas en Votación</h2>

          {activeProposals.length === 0 ? (
            <div className="bg-dark-surface rounded-xl p-8 text-center border border-white/10">
              <p className="text-white/60">No hay propuestas activas en este momento.</p>
              <Link
                href="/gobernanza/nueva"
                className="inline-block mt-4 text-brand-light hover:text-brand transition underline"
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
                    className="block bg-dark-surface rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          {proposal.category_icon && (
                            <span className="text-sm text-white/60">
                              {proposal.category_icon} {proposal.category_name}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            proposal.proposal_level === 2
                              ? 'bg-warning/20 text-warning'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            Nivel {proposal.proposal_level}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-brand-light transition-colors">
                          {proposal.title}
                        </h3>
                        <p className="text-white/60 mt-1 line-clamp-2">
                          {proposal.description}
                        </p>
                      </div>

                      {/* Resultados */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">
                          {percentages.for}%
                        </div>
                        <div className="text-sm text-white/50">
                          {proposal.total_votes} votos
                        </div>
                        {!quorumMet && (
                          <div className="text-xs text-warning mt-1">
                            Falta quorum
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
                      <div
                        className="bg-success transition-all"
                        style={{ width: `${percentages.for}%` }}
                      />
                      <div
                        className="bg-error transition-all"
                        style={{ width: `${percentages.against}%` }}
                      />
                      <div
                        className="bg-white/50 transition-all"
                        style={{ width: `${percentages.abstain}%` }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 text-sm text-white/50">
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
                className="bg-dark-surface rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all text-center"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-medium text-white">{category.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${
                  category.proposal_level === 2
                    ? 'bg-warning/20 text-warning'
                    : 'bg-white/10 text-white/60'
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
  iconColor
}: {
  icon: React.ReactNode
  label: string
  value: number
  iconColor: string
}) {
  return (
    <div className="bg-dark-surface border border-white/10 rounded-xl p-5">
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  )
}
