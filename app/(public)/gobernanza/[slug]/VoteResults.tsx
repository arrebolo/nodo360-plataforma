import { ProposalWithDetails } from '@/types/governance'
import { CheckCircle, XCircle, Users } from 'lucide-react'

interface VoteResultsProps {
  proposal: ProposalWithDetails
  percentages: { for: number; against: number; abstain: number }
  quorumMet: boolean
  passing: boolean
}

export function VoteResults({ proposal, percentages, quorumMet, passing }: VoteResultsProps) {
  const totalGPower = proposal.total_gpower_for + proposal.total_gpower_against + proposal.total_gpower_abstain

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold mb-4 text-white">Resultados</h2>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex h-4 rounded-full overflow-hidden bg-white/10 mb-2">
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${percentages.for}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${percentages.against}%` }}
          />
          <div
            className="bg-white/50 transition-all duration-500"
            style={{ width: `${percentages.abstain}%` }}
          />
        </div>

        {/* Leyenda */}
        <div className="flex justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-400">{percentages.for}% A favor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-red-400">{percentages.against}% En contra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/50" />
            <span className="text-white/60">{percentages.abstain}% Abstención</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{proposal.total_votes}</p>
          <p className="text-xs text-white/60">Votos totales</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalGPower.toFixed(1)}</p>
          <p className="text-xs text-white/60">gPower total</p>
        </div>
      </div>

      {/* Quorum */}
      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        quorumMet
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-yellow-500/10 border border-yellow-500/30'
      }`}>
        <Users className={`w-5 h-5 ${quorumMet ? 'text-green-400' : 'text-yellow-400'}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${quorumMet ? 'text-green-400' : 'text-yellow-400'}`}>
            {quorumMet ? 'Quorum alcanzado' : 'Quorum no alcanzado'}
          </p>
          <p className="text-xs text-white/60">
            {proposal.total_votes} de {proposal.quorum_required} votos requeridos
          </p>
        </div>
      </div>

      {/* Estado de aprobación */}
      {proposal.status === 'active' && quorumMet && (
        <div className={`flex items-center gap-3 p-3 rounded-lg mt-3 ${
          passing
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {passing ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <div>
            <p className={`text-sm font-medium ${passing ? 'text-green-400' : 'text-red-400'}`}>
              {passing ? 'Aprobación probable' : 'Rechazo probable'}
            </p>
            <p className="text-xs text-white/60">
              Requiere {Math.round(proposal.approval_threshold * 100)}% para aprobar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
