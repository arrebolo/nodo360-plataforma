import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProposals } from '@/lib/governance/queries'
import { PROPOSAL_STATUS_INFO, getVotePercentage, ProposalWithDetails } from '@/types/governance'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Clock, CheckCircle, Edit, Eye } from 'lucide-react'

export const metadata = {
  title: 'Mis Propuestas | Gobernanza | Nodo360',
  description: 'Gestiona tus propuestas de gobernanza',
}

export default async function MisPropuestasPage() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/gobernanza/mis-propuestas')
  }

  // Obtener propuestas del usuario
  const proposals = await getProposals({ authorId: user.id })

  // Agrupar por estado
  const drafts = proposals.filter(p => p.status === 'draft')
  const pending = proposals.filter(p => p.status === 'pending_review')
  const active = proposals.filter(p => p.status === 'active')
  const completed = proposals.filter(p => ['passed', 'rejected', 'implemented', 'cancelled'].includes(p.status))

  return (
    <div className="min-h-screen bg-dark-deep">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/gobernanza"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Gobernanza
            </Link>
            <h1 className="text-3xl font-bold text-white">Mis Propuestas</h1>
            <p className="text-white/60 mt-1">
              {proposals.length} propuesta{proposals.length !== 1 ? 's' : ''} en total
            </p>
          </div>
          <Link
            href="/gobernanza/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-brand-light hover:bg-brand-light/80 rounded-lg font-medium transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
            Nueva Propuesta
          </Link>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Borradores"
            value={drafts.length}
            color="gray"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="En Revisión"
            value={pending.length}
            color="yellow"
          />
          <StatCard
            icon={<Eye className="w-5 h-5" />}
            label="En Votación"
            value={active.length}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Finalizadas"
            value={completed.length}
            color="green"
          />
        </div>

        {proposals.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
            <FileText className="w-16 h-16 mx-auto text-white/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No tienes propuestas</h2>
            <p className="text-white/60 mb-6">
              ¡Crea tu primera propuesta y contribuye a la comunidad!
            </p>
            <Link
              href="/gobernanza/nueva"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-light hover:bg-brand-light/80 rounded-lg font-medium transition-colors text-white"
            >
              <Plus className="w-4 h-4" />
              Crear Propuesta
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Borradores */}
            {drafts.length > 0 && (
              <ProposalSection
                title="Borradores"
                proposals={drafts}
                showEdit
              />
            )}

            {/* En Revisión */}
            {pending.length > 0 && (
              <ProposalSection
                title="En Revisión"
                proposals={pending}
              />
            )}

            {/* En Votación */}
            {active.length > 0 && (
              <ProposalSection
                title="En Votación"
                proposals={active}
                showResults
              />
            )}

            {/* Finalizadas */}
            {completed.length > 0 && (
              <ProposalSection
                title="Finalizadas"
                proposals={completed}
                showResults
              />
            )}
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
  color
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'gray' | 'yellow' | 'blue' | 'green'
}) {
  const colors = {
    gray: 'bg-white/50/20 text-white/60',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
  }

  return (
    <div className={`${colors[color]} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function ProposalSection({
  title,
  proposals,
  showEdit = false,
  showResults = false
}: {
  title: string
  proposals: ProposalWithDetails[]
  showEdit?: boolean
  showResults?: boolean
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
      <div className="space-y-3">
        {proposals.map((proposal) => {
          const statusInfo = PROPOSAL_STATUS_INFO[proposal.status]
          const percentages = getVotePercentage(proposal)

          return (
            <div
              key={proposal.id}
              className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    {proposal.category_icon && (
                      <span className="text-sm text-white/60">
                        {proposal.category_icon} {proposal.category_name}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/gobernanza/${proposal.slug}`}
                    className="text-lg font-semibold hover:text-brand-light transition-colors text-white"
                  >
                    {proposal.title}
                  </Link>

                  <p className="text-white/60 text-sm mt-1 line-clamp-2">
                    {proposal.description}
                  </p>

                  {showResults && proposal.total_votes > 0 && (
                    <div className="mt-3">
                      <div className="flex h-2 rounded-full overflow-hidden bg-white/10 mb-1">
                        <div
                          className="bg-green-500"
                          style={{ width: `${percentages.for}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${percentages.against}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/50">
                        {proposal.total_votes} votos - {percentages.for}% a favor
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-white/50 mt-2">
                    Creada el {new Date(proposal.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {showEdit && (
                    <Link
                      href={`/gobernanza/${proposal.slug}/editar`}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}
                  <Link
                    href={`/gobernanza/${proposal.slug}`}
                    className="p-2 bg-brand-light/20 hover:bg-brand-light/30 text-brand-light rounded-lg transition-colors"
                    title="Ver"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}


