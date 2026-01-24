'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  User,
  Star,
  CheckCircle,
  Loader2,
} from 'lucide-react'

interface MentorVoteCardProps {
  application: {
    id: string
    user_id: string
    motivation: string
    experience?: string
    points_at_application: number
    votes_for: number
    votes_against: number
    votes_abstain: number
    total_eligible_voters: number
    quorum_met: boolean
    voting_starts_at: string
    voting_ends_at: string
    created_at: string
    users: {
      id: string
      full_name: string
      avatar_url?: string
    }
  }
  hasVoted: boolean
}

type VoteType = 'for' | 'against' | 'abstain'

export function MentorVoteCard({ application, hasVoted }: MentorVoteCardProps) {
  const router = useRouter()
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voted, setVoted] = useState(hasVoted)

  const timeLeft = getTimeLeft(application.voting_ends_at)
  const totalVotes = application.votes_for + application.votes_against + application.votes_abstain
  const quorumPercent = application.total_eligible_voters > 0
    ? Math.round((totalVotes / application.total_eligible_voters) * 100)
    : 0

  const handleVote = async () => {
    if (!selectedVote || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/mentor/applications/${application.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote: selectedVote,
          comment: comment.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al votar')
      }

      setVoted(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header con info del aplicante */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
              {application.users?.avatar_url ? (
                <img
                  src={application.users.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-brand" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {application.users?.full_name || 'Usuario'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Star className="w-3 h-3" />
                <span>{application.points_at_application} puntos</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Clock className="w-3 h-3" />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Progreso de quórum */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quorumPercent >= 50 ? 'bg-green-500' : 'bg-brand-light'}`}
              style={{ width: `${Math.min(100, quorumPercent)}%` }}
            />
          </div>
          <span className="text-xs text-white/40">
            {totalVotes}/{application.total_eligible_voters} votos ({quorumPercent}%)
          </span>
        </div>
      </div>

      {/* Motivación y experiencia */}
      <div className="p-5 space-y-3">
        <div>
          <h4 className="text-xs font-medium text-white/40 uppercase mb-1">Motivación</h4>
          <p className="text-sm text-white/80">{application.motivation}</p>
        </div>
        {application.experience && (
          <div>
            <h4 className="text-xs font-medium text-white/40 uppercase mb-1">Experiencia</h4>
            <p className="text-sm text-white/80">{application.experience}</p>
          </div>
        )}
      </div>

      {/* Sección de voto */}
      <div className="p-5 border-t border-white/10 bg-white/[0.02]">
        {voted ? (
          <div className="text-center py-2">
            <CheckCircle className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <p className="text-sm text-green-400 font-medium">Ya votaste en esta aplicación</p>
          </div>
        ) : (
          <>
            {/* Botones de voto */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedVote('for')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  selectedVote === 'for'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-white/10 hover:border-white/30 text-white/60'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="text-xs font-medium">Aprobar</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedVote('against')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  selectedVote === 'against'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-white/10 hover:border-white/30 text-white/60'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="text-xs font-medium">Rechazar</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedVote('abstain')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  selectedVote === 'abstain'
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                    : 'border-white/10 hover:border-white/30 text-white/60'
                }`}
              >
                <Minus className="w-5 h-5" />
                <span className="text-xs font-medium">Abstener</span>
              </button>
            </div>

            {/* Comentario opcional */}
            {selectedVote && (
              <div className="mb-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comentario opcional..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                             text-white placeholder-white/30 text-sm resize-none
                             focus:outline-none focus:border-brand-light transition-colors"
                  maxLength={500}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Botón votar */}
            <button
              onClick={handleVote}
              disabled={!selectedVote || isLoading}
              className="w-full py-2.5 bg-brand-light hover:bg-brand-light/80 rounded-lg text-sm font-medium
                         text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Votando...
                </>
              ) : (
                'Confirmar Voto'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function getTimeLeft(endDate: string): string {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return 'Finalizado'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h restantes`
  if (hours > 0) return `${hours}h restantes`

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes}min restantes`
}
