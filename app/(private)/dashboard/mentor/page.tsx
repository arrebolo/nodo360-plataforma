import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import {
  ArrowLeft,
  Users,
  Star,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  Shield,
  FileText,
} from 'lucide-react'

export const metadata = {
  title: 'Mentor | Nodo360',
  description: 'Panel de mentor y aplicaciones',
}

function getStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    voting: { label: 'En votación', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    approved: { label: 'Aprobada', color: 'text-green-400', bg: 'bg-green-500/20' },
    rejected: { label: 'Rechazada', color: 'text-red-400', bg: 'bg-red-500/20' },
    auto_approved: { label: 'Auto-aprobada', color: 'text-green-400', bg: 'bg-green-500/20' },
    auto_rejected: { label: 'Auto-rechazada', color: 'text-red-400', bg: 'bg-red-500/20' },
  }
  return map[status] || { label: status, color: 'text-white/60', bg: 'bg-white/10' }
}

export default async function MentorPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener perfil y rol
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isMentor = profile?.role === 'mentor' || profile?.role === 'admin'

  // Datos para mentores
  let monthlyStats: any = null
  let mentorProfile: any = null

  if (isMentor) {
    // Stats del mes actual
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const { data: stats } = await supabase
      .from('mentor_monthly_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .maybeSingle()

    monthlyStats = stats

    // Perfil de mentor
    const { data: mProfile } = await supabase
      .from('mentors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    mentorProfile = mProfile
  }

  // Elegibilidad (para no-mentores)
  let eligibility: any = null
  if (!isMentor) {
    const { data: result } = await supabase
      .rpc('can_apply_mentor', { p_user_id: user.id })
    eligibility = result
  }

  // Aplicaciones propias
  const { data: applications } = await supabase
    .from('mentor_applications')
    .select('id, status, motivation, created_at, decided_at, decision_reason, decision_method')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* Header */}
        <PageHeader
          icon={Users}
          title={isMentor ? 'Panel de Mentor' : 'Ser Mentor'}
          subtitle={isMentor ? 'Estadísticas y actividad de mentoría' : 'Aplica para convertirte en mentor de la comunidad'}
        />

        {isMentor ? (
          /* ===== VISTA MENTOR ===== */
          <>
            {/* Stats mensuales */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                icon={<Star className="w-5 h-5" />}
                title="Puntos del Mes"
                value={monthlyStats?.points_earned || 0}
              />
              <StatCard
                icon={<MessageSquare className="w-5 h-5" />}
                title="Sesiones"
                value={monthlyStats?.sessions_completed || 0}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Calificación"
                value={monthlyStats?.avg_rating ? `${monthlyStats.avg_rating.toFixed(1)}/5` : 'N/A'}
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Warnings"
                value={mentorProfile?.warnings || 0}
                className={mentorProfile?.warnings > 0 ? 'border-yellow-500/30' : ''}
              />
            </div>

            {/* Info del mentor */}
            <Card className="mb-8 bg-gradient-to-br from-brand-light/10 to-transparent">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Estado de Mentor</h2>
                  <p className="text-sm text-white/50">
                    Mentor desde {mentorProfile?.created_at ? new Date(mentorProfile.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-2xl font-bold text-white">{mentorProfile?.total_points || 0}</div>
                  <div className="text-sm text-white/50">Puntos totales</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-2xl font-bold text-white">{mentorProfile?.total_sessions || 0}</div>
                  <div className="text-sm text-white/50">Sesiones totales</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className={`text-2xl font-bold ${mentorProfile?.warnings > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {mentorProfile?.warnings || 0}/3
                  </div>
                  <div className="text-sm text-white/50">Warnings (máx. 3)</div>
                </div>
              </div>
              {mentorProfile?.warnings > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tienes {mentorProfile.warnings} warning(s). Al llegar a 3 se revoca el rol de mentor.
                  </p>
                </div>
              )}
            </Card>

            {/* Link a votaciones */}
            <Card className="mb-8">
              <Link
                href="/gobernanza/mentores"
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-brand-light transition-colors">
                    Votaciones de Mentores
                  </h3>
                  <p className="text-sm text-white/50">Revisa y vota aplicaciones pendientes</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-white/30 rotate-180" />
              </Link>
            </Card>
          </>
        ) : (
          /* ===== VISTA NO-MENTOR ===== */
          <>
            {/* Elegibilidad */}
            <Card className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Requisitos para ser Mentor</h2>
                  <p className="text-sm text-white/50">Cumple estos requisitos para poder aplicar</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <RequirementItem
                  met={eligibility?.has_enough_points}
                  label="Tener al menos 650 puntos de experiencia"
                />
                <RequirementItem
                  met={eligibility?.has_completed_courses}
                  label="Haber completado los cursos requeridos"
                />
                <RequirementItem
                  met={eligibility?.no_pending_application}
                  label="No tener una aplicación pendiente"
                />
                <RequirementItem
                  met={eligibility?.cooldown_passed}
                  label="No estar en período de espera"
                />
              </div>

              {eligibility?.can_apply ? (
                <Link
                  href="/dashboard/mentor/aplicar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-light hover:bg-brand-light/80 rounded-xl text-sm font-medium text-white transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Aplicar a Mentor
                </Link>
              ) : (
                <p className="text-sm text-white/50">
                  {eligibility?.reason || 'No cumples los requisitos para aplicar.'}
                </p>
              )}
            </Card>
          </>
        )}

        {/* Historial de aplicaciones */}
        {applications && applications.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-white/60" />
              Mis Aplicaciones
            </h2>
            <div className="space-y-3">
              {applications.map((app: any) => {
                const statusInfo = getStatusInfo(app.status)
                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(app.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2">{app.motivation}</p>
                    {app.decision_reason && (
                      <p className="text-xs text-white/40 mt-2">
                        Razón: {app.decision_reason}
                      </p>
                    )}
                    {app.decision_method && (
                      <p className="text-xs text-white/30 mt-1">
                        Método: {app.decision_method === 'community_vote' ? 'Voto comunitario' : 'Decisión directa'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function RequirementItem({ met, label }: { met?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      {met ? (
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-white/30 flex-shrink-0" />
      )}
      <span className={`text-sm ${met ? 'text-white' : 'text-white/50'}`}>{label}</span>
    </div>
  )
}
