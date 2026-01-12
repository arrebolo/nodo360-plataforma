import { getProposals, getGovernanceStats } from '@/lib/governance/queries'
import { PROPOSAL_STATUS_INFO, getVotePercentage, hasQuorum } from '@/types/governance'
import Link from 'next/link'
import { ArrowLeft, Clock, Filter, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Historial | Gobernanza | Nodo360',
  description: 'Historial de propuestas de gobernanza',
}

interface PageProps {
  searchParams: Promise<{ estado?: string; nivel?: string }>
}

export default async function HistorialPage({ searchParams }: PageProps) {
  const params = await searchParams
  const estadoFilter = params.estado
  const nivelFilter = params.nivel

  // Obtener todas las propuestas (excepto drafts)
  let proposals = await getProposals({
    status: ['pending_review', 'active', 'passed', 'rejected', 'implemented', 'cancelled']
  })

  // Aplicar filtros
  if (estadoFilter) {
    proposals = proposals.filter(p => p.status === estadoFilter)
  }
  if (nivelFilter) {
    proposals = proposals.filter(p => p.proposal_level === parseInt(nivelFilter))
  }

  // Obtener estadísticas
  const stats = await getGovernanceStats()

  // Contar por estado (sin filtro)
  const allProposals = await getProposals({
    status: ['pending_review', 'active', 'passed', 'rejected', 'implemented', 'cancelled']
  })

  const statusCounts = {
    all: allProposals.length,
    pending_review: allProposals.filter(p => p.status === 'pending_review').length,
    active: allProposals.filter(p => p.status === 'active').length,
    passed: allProposals.filter(p => p.status === 'passed').length,
    rejected: allProposals.filter(p => p.status === 'rejected').length,
    implemented: allProposals.filter(p => p.status === 'implemented').length,
  }

  return (
    <div className="min-h-screen bg-dark-deep">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/gobernanza"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Gobernanza
          </Link>
          <h1 className="text-3xl font-bold text-white">Historial de Propuestas</h1>
          <p className="text-white/60 mt-1">
            Todas las propuestas de la comunidad
          </p>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{stats.totalProposals}</p>
            <p className="text-xs text-white/60">Total</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{stats.activeProposals}</p>
            <p className="text-xs text-white/60">En Votación</p>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
            <p className="text-2xl font-bold text-green-400">{stats.passedProposals}</p>
            <p className="text-xs text-white/60">Aprobadas</p>
          </div>
          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
            <p className="text-2xl font-bold text-purple-400">{stats.totalVotes}</p>
            <p className="text-xs text-white/60">Votos Totales</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
            <p className="text-2xl font-bold text-amber-400">{stats.totalParticipants}</p>
            <p className="text-xs text-white/60">Participantes</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-white/60" />
            <span className="text-sm font-medium text-white">Filtrar por estado</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              href="/gobernanza/historial"
              active={!estadoFilter}
              count={statusCounts.all}
            >
              Todos
            </FilterButton>
            <FilterButton
              href="/gobernanza/historial?estado=pending_review"
              active={estadoFilter === 'pending_review'}
              count={statusCounts.pending_review}
              color="yellow"
            >
              En Revisión
            </FilterButton>
            <FilterButton
              href="/gobernanza/historial?estado=active"
              active={estadoFilter === 'active'}
              count={statusCounts.active}
              color="blue"
            >
              En Votación
            </FilterButton>
            <FilterButton
              href="/gobernanza/historial?estado=passed"
              active={estadoFilter === 'passed'}
              count={statusCounts.passed}
              color="green"
            >
              Aprobadas
            </FilterButton>
            <FilterButton
              href="/gobernanza/historial?estado=rejected"
              active={estadoFilter === 'rejected'}
              count={statusCounts.rejected}
              color="red"
            >
              Rechazadas
            </FilterButton>
            <FilterButton
              href="/gobernanza/historial?estado=implemented"
              active={estadoFilter === 'implemented'}
              count={statusCounts.implemented}
              color="purple"
            >
              Implementadas
            </FilterButton>
          </div>
        </div>

        {/* Lista de propuestas */}
        {proposals.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
            <Clock className="w-16 h-16 mx-auto text-white/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No hay propuestas</h2>
            <p className="text-white/60">
              {estadoFilter
                ? 'No hay propuestas con este filtro.'
                : 'Aún no se han creado propuestas públicas.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const statusInfo = PROPOSAL_STATUS_INFO[proposal.status]
              const percentages = getVotePercentage(proposal)
              const quorumMet = hasQuorum(proposal)

              return (
                <Link
                  key={proposal.id}
                  href={`/gobernanza/${proposal.slug}`}
                  className="block bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className={`p-3 rounded-xl ${statusInfo.bgColor} flex-shrink-0`}>
                      <span className="text-2xl">{statusInfo.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {proposal.category_icon && (
                          <span className="text-sm text-white/60">
                            {proposal.category_icon} {proposal.category_name}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          proposal.proposal_level === 2
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/50/20 text-white/60'
                        }`}>
                          Nivel {proposal.proposal_level}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold group-hover:text-brand-light transition-colors truncate text-white">
                        {proposal.title}
                      </h3>

                      <p className="text-white/60 text-sm mt-1 line-clamp-2">
                        {proposal.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-white/50 flex-wrap">
                        <span className="flex items-center gap-1">
                          {proposal.author_avatar ? (
                            <img
                              src={proposal.author_avatar}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                          ) : null}
                          {proposal.author_name || 'Usuario'}
                        </span>
                        <span>
                          {new Date(proposal.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {proposal.total_votes > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {proposal.total_votes} votos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Results (si aplica) */}
                    {proposal.total_votes > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-bold ${
                          percentages.for >= 50 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {percentages.for}%
                        </p>
                        <p className="text-xs text-white/50">a favor</p>
                        {quorumMet ? (
                          <span className="text-xs text-green-400">Quorum</span>
                        ) : (
                          <span className="text-xs text-yellow-400">Sin quorum</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterButton({
  href,
  active,
  count,
  color = 'gray',
  children
}: {
  href: string
  active: boolean
  count: number
  color?: 'gray' | 'yellow' | 'blue' | 'green' | 'red' | 'purple'
  children: React.ReactNode
}) {
  const colors = {
    gray: active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10',
    yellow: active ? 'bg-yellow-500/30 text-yellow-400' : 'bg-white/5 text-white/60 hover:bg-yellow-500/10',
    blue: active ? 'bg-blue-500/30 text-blue-400' : 'bg-white/5 text-white/60 hover:bg-blue-500/10',
    green: active ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-white/60 hover:bg-green-500/10',
    red: active ? 'bg-red-500/30 text-red-400' : 'bg-white/5 text-white/60 hover:bg-red-500/10',
    purple: active ? 'bg-purple-500/30 text-purple-400' : 'bg-white/5 text-white/60 hover:bg-purple-500/10',
  }

  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${colors[color]}`}
    >
      {children}
      <span className="ml-1 opacity-60">({count})</span>
    </Link>
  )
}


