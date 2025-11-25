import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProposals } from '@/lib/governance/queries'
import { PROPOSAL_STATUS_INFO } from '@/types/governance'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Clock,
  Vote,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { AdminActionButtons } from './AdminActionButtons'

export const metadata = {
  title: 'Gobernanza | Admin | Nodo360',
  description: 'Panel de administración de gobernanza',
}

export default async function AdminGobernanzaPage() {
  const supabase = await createClient()

  // Verificar autenticación y rol admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/admin/gobernanza')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'mentor'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Obtener todas las propuestas
  const allProposals = await getProposals({})

  // Agrupar por estado
  const pendingReview = allProposals.filter(p => p.status === 'pending_review')
  const active = allProposals.filter(p => p.status === 'active')
  const passed = allProposals.filter(p => p.status === 'passed')
  const rejected = allProposals.filter(p => p.status === 'rejected')
  const implemented = allProposals.filter(p => p.status === 'implemented')
  const cancelled = allProposals.filter(p => p.status === 'cancelled')
  const drafts = allProposals.filter(p => p.status === 'draft')

  const isAdmin = profile.role === 'admin'

  return (
    <div className="min-h-screen bg-[#0a0d14]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Admin
          </Link>
          <h1 className="text-3xl font-bold text-white">Panel de Gobernanza</h1>
          <p className="text-gray-400 mt-1">
            Gestión y moderación de propuestas de la comunidad
          </p>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Total"
            value={allProposals.length}
            color="gray"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pendientes"
            value={pendingReview.length}
            color="yellow"
            highlight={pendingReview.length > 0}
          />
          <StatCard
            icon={<Vote className="w-5 h-5" />}
            label="En Votación"
            value={active.length}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Aprobadas"
            value={passed.length}
            color="green"
          />
          <StatCard
            icon={<XCircle className="w-5 h-5" />}
            label="Rechazadas"
            value={rejected.length}
            color="red"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Implementadas"
            value={implemented.length}
            color="purple"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Canceladas"
            value={cancelled.length}
            color="orange"
          />
        </div>

        {/* Sección prioritaria: Pendientes de revisión */}
        {pendingReview.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Pendientes de Revisión</h2>
                <p className="text-sm text-gray-400">Propuestas esperando aprobación para votación</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                {pendingReview.length} pendiente{pendingReview.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {pendingReview.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  actions={['validate', 'reject_validation']}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sección: En Votación */}
        {active.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Vote className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">En Votación</h2>
                <p className="text-sm text-gray-400">Propuestas activas en período de votación</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                {active.length} activa{active.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {active.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  actions={isAdmin ? ['cancel', 'veto'] : ['cancel']}
                  showVoteStats
                />
              ))}
            </div>
          </section>
        )}

        {/* Sección: Aprobadas (pendientes de implementar) */}
        {passed.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Aprobadas</h2>
                <p className="text-sm text-gray-400">Propuestas aprobadas pendientes de implementación</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {passed.length} aprobada{passed.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {passed.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  actions={isAdmin ? ['implement', 'veto'] : ['implement']}
                  showVoteStats
                />
              ))}
            </div>
          </section>
        )}

        {/* Sección: Implementadas */}
        {implemented.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Implementadas</h2>
                <p className="text-sm text-gray-400">Propuestas completadas</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                {implemented.length}
              </span>
            </div>

            <div className="space-y-3">
              {implemented.slice(0, 5).map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  actions={[]}
                  showVoteStats
                />
              ))}
              {implemented.length > 5 && (
                <p className="text-center text-gray-500 text-sm">
                  +{implemented.length - 5} más implementadas
                </p>
              )}
            </div>
          </section>
        )}

        {/* Estado vacío */}
        {allProposals.length === 0 && (
          <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
            <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No hay propuestas</h2>
            <p className="text-gray-400">
              Aún no se han creado propuestas en el sistema de gobernanza.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'gray' | 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'orange'
  highlight?: boolean
}) {
  const colors = {
    gray: 'bg-gray-500/20 text-gray-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
  }

  return (
    <div className={`${colors[color]} rounded-xl p-4 ${highlight ? 'ring-2 ring-yellow-500/50 animate-pulse' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}

function ProposalCard({
  proposal,
  actions,
  showVoteStats = false
}: {
  proposal: any
  actions: string[]
  showVoteStats?: boolean
}) {
  const statusInfo = PROPOSAL_STATUS_INFO[proposal.status as keyof typeof PROPOSAL_STATUS_INFO]
  const totalVotes = proposal.total_votes || 0
  const votesFor = proposal.votes_for || 0
  const votesAgainst = proposal.votes_against || 0
  const percentFor = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0

  return (
    <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all">
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

          <Link
            href={`/gobernanza/${proposal.slug}`}
            className="text-lg font-semibold hover:text-[#ff6b35] transition-colors text-white block truncate"
          >
            {proposal.title}
          </Link>

          <p className="text-gray-400 text-sm mt-1 line-clamp-1">
            {proposal.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
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
                month: 'short'
              })}
            </span>
            {showVoteStats && totalVotes > 0 && (
              <>
                <span>{totalVotes} votos</span>
                <span className={percentFor >= 50 ? 'text-green-400' : 'text-red-400'}>
                  {percentFor}% a favor
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex-shrink-0">
            <AdminActionButtons proposalId={proposal.id} actions={actions} />
          </div>
        )}
      </div>
    </div>
  )
}
