import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getProposalBySlug, getProposalVotes, hasUserVoted, getUserGPower } from '@/lib/governance/queries'
import { PROPOSAL_STATUS_INFO, VOTE_INFO, getVotePercentage, hasQuorum, isPassing, VoteWithVoter } from '@/types/governance'
import { VoteSection } from './VoteSection'
import { VoteResults } from './VoteResults'
import { ProposalTimeline } from './ProposalTimeline'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Tag, User } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const proposal = await getProposalBySlug(slug)

  if (!proposal) {
    return { title: 'Propuesta no encontrada | Nodo360' }
  }

  return {
    title: `${proposal.title} | Gobernanza | Nodo360`,
    description: proposal.description,
  }
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Obtener propuesta
  const proposal = await getProposalBySlug(slug)
  if (!proposal) {
    notFound()
  }

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar autenticación obligatoria para ver propuestas
  if (!user) {
    redirect(`/login?redirect=/gobernanza/${slug}`)
  }

  // Datos adicionales
  const votes = await getProposalVotes(proposal.id)
  const userHasVoted = user ? await hasUserVoted(proposal.id, user.id) : false
  const userGPower = user ? await getUserGPower(user.id) : 0

  // Calcular porcentajes y estado
  const percentages = getVotePercentage(proposal)
  const quorumMet = hasQuorum(proposal)
  const passing = isPassing(proposal)
  const statusInfo = PROPOSAL_STATUS_INFO[proposal.status]

  // Tiempo restante
  const now = new Date()
  const endDate = proposal.voting_ends_at ? new Date(proposal.voting_ends_at) : null
  const isVotingOpen = proposal.status === 'active' && endDate && endDate > now
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="min-h-screen bg-dark-deep">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/gobernanza"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Gobernanza
        </Link>

        {/* Header */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
          {/* Status y categoría */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
            {proposal.category_icon && (
              <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80">
                {proposal.category_icon} {proposal.category_name}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm ${
              proposal.proposal_level === 2
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-white/50/20 text-white/60'
            }`}>
              Nivel {proposal.proposal_level}
            </span>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold mb-4 text-white">{proposal.title}</h1>

          {/* Descripción */}
          <p className="text-lg text-white/80 mb-6">{proposal.description}</p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
            {/* Autor */}
            <div className="flex items-center gap-2">
              {proposal.author_avatar ? (
                <img
                  src={proposal.author_avatar}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span>{proposal.author_name || 'Usuario'}</span>
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                {proposal.author_gpower} gP
              </span>
            </div>

            {/* Fecha */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(proposal.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>

            {/* Tiempo restante */}
            {isVotingOpen && (
              <div className="flex items-center gap-2 text-blue-400">
                <Clock className="w-4 h-4" />
                {daysRemaining} días restantes
              </div>
            )}
          </div>

          {/* Tags */}
          {proposal.tags && proposal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {proposal.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-sm text-white/60">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Contenido y votos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contenido detallado */}
            {proposal.detailed_content && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-4 text-white">Detalles</h2>
                <div className="prose prose-invert max-w-none text-white/80 whitespace-pre-wrap">
                  {proposal.detailed_content}
                </div>
              </div>
            )}

            {/* Resultados de votación */}
            <VoteResults
              proposal={proposal}
              percentages={percentages}
              quorumMet={quorumMet}
              passing={passing}
            />

            {/* Lista de votos recientes */}
            {votes.length > 0 && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Votos Recientes ({votes.length})
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {votes.slice(0, 20).map((vote: VoteWithVoter) => {
                    const voteInfo = VOTE_INFO[vote.vote]
                    return (
                      <div
                        key={vote.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {vote.voter?.avatar_url ? (
                            <img
                              src={vote.voter.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-white">
                              {vote.voter?.full_name || 'Usuario'}
                            </p>
                            <p className="text-xs text-white/50">
                              {vote.gpower_used} gP
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${voteInfo.bgColor} ${voteInfo.color}`}>
                          {voteInfo.icon} {voteInfo.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha - Votación */}
          <div className="space-y-6">
            <VoteSection
              proposal={proposal}
              user={user}
              userHasVoted={userHasVoted}
              userGPower={userGPower}
              isVotingOpen={isVotingOpen || false}
            />

            {/* Timeline */}
            <ProposalTimeline proposal={proposal} />
          </div>
        </div>
      </div>
    </div>
  )
}
