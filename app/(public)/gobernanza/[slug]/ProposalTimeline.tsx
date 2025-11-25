import { ProposalWithDetails } from '@/types/governance'
import { CheckCircle, Circle, Clock } from 'lucide-react'

interface ProposalTimelineProps {
  proposal: ProposalWithDetails
}

export function ProposalTimeline({ proposal }: ProposalTimelineProps) {
  const steps = [
    {
      key: 'draft',
      label: 'Borrador',
      completed: true,
      date: proposal.created_at
    },
    {
      key: 'pending_review',
      label: 'En Revisión',
      completed: ['pending_review', 'active', 'passed', 'rejected', 'implemented'].includes(proposal.status),
      date: proposal.status !== 'draft' ? proposal.updated_at : null
    },
    {
      key: 'active',
      label: 'Votación',
      completed: ['active', 'passed', 'rejected', 'implemented'].includes(proposal.status),
      date: proposal.voting_starts_at
    },
    {
      key: 'result',
      label: proposal.status === 'passed' || proposal.status === 'implemented' ? 'Aprobada' : 'Resultado',
      completed: ['passed', 'rejected', 'implemented'].includes(proposal.status),
      date: proposal.status === 'passed' || proposal.status === 'rejected' ? proposal.updated_at : null
    },
  ]

  const currentStepIndex = steps.findIndex(s => !s.completed) - 1

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-4 text-white">Timeline</h3>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex + 1
          const isPast = step.completed

          return (
            <div key={step.key} className="flex gap-3">
              {/* Indicador */}
              <div className="flex flex-col items-center">
                {isPast ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : isActive ? (
                  <Clock className="w-6 h-6 text-blue-400 animate-pulse" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-600" />
                )}
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${
                    isPast ? 'bg-green-400/50' : 'bg-gray-700'
                  }`} />
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 pb-4">
                <p className={`font-medium ${
                  isPast ? 'text-white' : isActive ? 'text-blue-400' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-gray-500">
                    {new Date(step.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
