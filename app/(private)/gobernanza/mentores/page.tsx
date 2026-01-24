import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import {
  ArrowLeft,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { MentorVoteCard } from './MentorVoteCard'

export const metadata = {
  title: 'Votaciones de Mentores | Nodo360',
  description: 'Vota en aplicaciones de nuevos mentores',
}

export default async function GobernanzaMentoresPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Verificar que sea mentor o admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['mentor', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Obtener aplicaciones en votación
  const { data: applications } = await supabase
    .from('mentor_applications')
    .select(`
      id,
      user_id,
      motivation,
      experience,
      points_at_application,
      status,
      votes_for,
      votes_against,
      votes_abstain,
      total_eligible_voters,
      quorum_met,
      voting_starts_at,
      voting_ends_at,
      created_at,
      users!mentor_applications_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'voting')
    .order('voting_ends_at', { ascending: true })

  // Obtener votos del usuario actual
  const applicationIds = applications?.map(a => a.id) || []
  let myVotes: Set<string> = new Set()

  if (applicationIds.length > 0) {
    const { data: votes } = await supabase
      .from('mentor_application_votes')
      .select('application_id')
      .eq('voter_id', user.id)
      .in('application_id', applicationIds)

    myVotes = new Set(votes?.map(v => v.application_id) || [])
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/mentor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel de mentor
        </Link>

        {/* Header */}
        <PageHeader
          icon={Users}
          title="Votaciones de Mentores"
          subtitle="Revisa y vota las aplicaciones de nuevos mentores"
        />

        {/* Info */}
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Tu voto es confidencial y permanente. Revisa la motivación y experiencia antes de votar.
          </p>
        </div>

        {/* Aplicaciones en votación */}
        {!applications || applications.length === 0 ? (
          <Card className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-white/20 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Sin votaciones pendientes</h3>
            <p className="text-sm text-white/50">
              No hay aplicaciones de mentor en proceso de votación actualmente.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app: any) => (
              <MentorVoteCard
                key={app.id}
                application={app}
                hasVoted={myVotes.has(app.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
