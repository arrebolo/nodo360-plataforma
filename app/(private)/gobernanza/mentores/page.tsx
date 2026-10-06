import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/ui/PageHeader'
import {
  ArrowLeft,
  Users,
  AlertCircle,
} from 'lucide-react'
import { MentorVoteCard } from './MentorVoteCard'

export const metadata = {
  title: 'Votaciones de Mentores',
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
      created_at
    `)
    .eq('status', 'voting')
    .order('voting_ends_at', { ascending: true })

  // LAS FICHAS DE QUIEN APLICA, APARTE Y CON EL SERVICIO.
  //
  // Era un embed `users!mentor_applications_user_id_fkey(...)`. Quien aplica a
  // mentor es, por definicion, alguien que AUN NO lo es: un alumno. La politica
  // por funcion de la 123 no da su ficha a otra sesion, asi que el embed
  // volveria vacio y la tarjeta de voto se quedaria sin nombre ni avatar.
  //
  // La consulta de arriba no se toca —lleva su RLS— y aqui solo se resuelven los
  // nombres de los ids que ya ha devuelto. Se adjuntan como `users` para que
  // MentorVoteCard siga leyendo lo mismo. Delante esta el redirect que exige
  // rol mentor o admin.
  const idsQueAplican = [...new Set((applications ?? []).map((a) => a.user_id))]
  const { data: fichas } = idsQueAplican.length
    ? await createAdminClient().from('users').select('id, full_name, avatar_url').in('id', idsQueAplican)
    : { data: [] }
  const fichaPorId = new Map((fichas ?? []).map((u) => [u.id, u]))
  const aplicacionesConFicha = (applications ?? []).map((a) => ({
    ...a,
    users: fichaPorId.get(a.user_id) ?? null,
  }))

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
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No hay aplicaciones pendientes</h3>
            <p className="text-sm text-gray-400">
              Cuando haya nuevas solicitudes de mentores, aparecerán aquí para tu revisión
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {aplicacionesConFicha.map((app: any) => (
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
