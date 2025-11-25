'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProposalWithDetails, VoteType, VOTE_INFO } from '@/types/governance'
import { User } from '@supabase/supabase-js'
import { ThumbsUp, ThumbsDown, Minus, Zap, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface VoteSectionProps {
  proposal: ProposalWithDetails
  user: User | null
  userHasVoted: boolean
  userGPower: number
  isVotingOpen: boolean
}

export function VoteSection({
  proposal,
  user,
  userHasVoted,
  userGPower,
  isVotingOpen
}: VoteSectionProps) {
  const router = useRouter()
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleVote = async () => {
    if (!selectedVote || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/governance/proposals/${proposal.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote: selectedVote,
          comment: comment.trim() || null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al votar')
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // Usuario no logueado
  if (!user) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto text-gray-500 mb-3" />
          <h3 className="font-semibold mb-2 text-white">Inicia sesión para votar</h3>
          <p className="text-sm text-gray-400 mb-4">
            Necesitas una cuenta para participar en la gobernanza.
          </p>
          <Link
            href={`/login?redirect=/gobernanza/${proposal.slug}`}
            className="inline-block px-6 py-2 bg-[#ff6b35] hover:bg-[#ff6b35]/80 rounded-lg font-medium transition-colors text-white"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  // Ya votó
  if (userHasVoted || success) {
    return (
      <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
          <h3 className="font-semibold text-green-400 mb-2">¡Ya votaste!</h3>
          <p className="text-sm text-gray-400">
            Tu voto de <strong>{userGPower} gP</strong> ha sido registrado.
          </p>
        </div>
      </div>
    )
  }

  // Votación no abierta
  if (!isVotingOpen) {
    const message = proposal.status === 'pending_review'
      ? 'Esta propuesta está en revisión.'
      : proposal.status === 'draft'
      ? 'Esta propuesta es un borrador.'
      : proposal.status === 'passed' || proposal.status === 'rejected'
      ? 'La votación ha finalizado.'
      : 'La votación no está disponible.';

    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto text-gray-500 mb-3" />
          <h3 className="font-semibold mb-2 text-white">Votación no disponible</h3>
          <p className="text-sm text-gray-400">{message}</p>
        </div>
      </div>
    )
  }

  // Formulario de votación
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4 text-white">Tu Voto</h3>

      {/* gPower del usuario */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-purple-500/10 rounded-lg">
        <Zap className="w-5 h-5 text-purple-400" />
        <span className="text-sm text-white">Tu poder de voto:</span>
        <span className="font-bold text-purple-400">{userGPower} gP</span>
      </div>

      {/* Opciones de voto */}
      <div className="space-y-2 mb-4">
        <VoteButton
          type="for"
          selected={selectedVote === 'for'}
          onClick={() => setSelectedVote('for')}
          icon={<ThumbsUp className="w-5 h-5" />}
        />
        <VoteButton
          type="against"
          selected={selectedVote === 'against'}
          onClick={() => setSelectedVote('against')}
          icon={<ThumbsDown className="w-5 h-5" />}
        />
        <VoteButton
          type="abstain"
          selected={selectedVote === 'abstain'}
          onClick={() => setSelectedVote('abstain')}
          icon={<Minus className="w-5 h-5" />}
        />
      </div>

      {/* Comentario opcional */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Por qué votas así?"
          rows={2}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg
                     text-white placeholder-gray-500 text-sm resize-none
                     focus:outline-none focus:border-[#ff6b35]"
          maxLength={280}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Botón votar */}
      <button
        onClick={handleVote}
        disabled={!selectedVote || isLoading}
        className="w-full py-3 bg-[#ff6b35] hover:bg-[#ff6b35]/80 rounded-lg font-medium
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
      >
        {isLoading ? 'Enviando...' : `Votar con ${userGPower} gP`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Tu voto es permanente y no puede cambiarse.
      </p>
    </div>
  )
}

function VoteButton({
  type,
  selected,
  onClick,
  icon
}: {
  type: VoteType
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  const info = VOTE_INFO[type]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
        selected
          ? `${info.bgColor} ${info.color} border-current`
          : 'border-white/10 hover:border-white/30 text-white'
      }`}
    >
      <span className={selected ? info.color : 'text-gray-400'}>{icon}</span>
      <span className="font-medium">{info.label}</span>
    </button>
  )
}
