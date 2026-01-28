import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
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
  Landmark,
  Zap,
  BadgeCheck,
  Lock,
  ClipboardCheck,
  Calendar,
  Activity,
  Vote,
  AlertCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Mentor | Nodo360',
  description: 'Panel de mentor y aplicaciones',
}

const BENEFITS = [
  {
    icon: Landmark,
    title: 'Poder de Decisión',
    description: 'Vota y decide el futuro de la plataforma',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
  {
    icon: Zap,
    title: 'gPower Aumentado',
    description: 'Mayor peso en votaciones de gobernanza',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  {
    icon: BadgeCheck,
    title: 'Badge de Mentor',
    description: 'Distintivo exclusivo en tu perfil',
    color: 'text-brand-light',
    bgColor: 'bg-brand/20',
  },
  {
    icon: Users,
    title: 'Mentoría Remunerada',
    description: 'Sesiones 1:1 con estudiantes (próximamente)',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    icon: Lock,
    title: 'Acceso Exclusivo',
    description: 'Canal privado de mentores',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    icon: ClipboardCheck,
    title: 'Validar Contenido',
    description: 'Revisa y aprueba cursos de instructores',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
]

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
    .select('role, full_name, created_at')
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
  let meritPoints = 0
  let hasInstructorCert = false
  let accountAge = 0
  let totalMentors = 0
  const maxMentors = 50 // Placeholder - could come from config

  if (!isMentor) {
    const { data: result } = await supabase
      .rpc('can_apply_mentor', { p_user_id: user.id })
    eligibility = result

    // Obtener puntos de mérito
    const { data: points } = await supabase
      .from('mentor_points')
      .select('total_points')
      .eq('user_id', user.id)
      .maybeSingle()
    meritPoints = points?.total_points || 0

    // Verificar si tiene certificación de instructor
    const { data: certs } = await supabase
      .from('instructor_certifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
    hasInstructorCert = (certs?.length || 0) > 0

    // Calcular antigüedad de cuenta
    if (profile?.created_at) {
      const created = new Date(profile.created_at)
      const now = new Date()
      accountAge = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }

    // Contar mentores activos
    const { count } = await supabase
      .from('mentors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    totalMentors = count || 0
  }

  // Aplicaciones propias
  const { data: applications } = await supabase
    .from('mentor_applications')
    .select('id, status, motivation, created_at, decided_at, decision_reason, decision_method')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calcular próxima evaluación (ejemplo: cada 3 meses)
  const getNextEvaluation = () => {
    if (!mentorProfile?.created_at) return null
    const created = new Date(mentorProfile.created_at)
    const now = new Date()
    const monthsSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const nextEvalMonth = Math.ceil((monthsSince + 1) / 3) * 3
    const nextEval = new Date(created)
    nextEval.setMonth(nextEval.getMonth() + nextEvalMonth)
    return nextEval
  }

  const nextEvaluation = getNextEvaluation()

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
          icon={Shield}
          title={isMentor ? 'Panel de Mentor' : 'Ser Mentor'}
          subtitle={isMentor ? 'Estadísticas y actividad de mentoría' : 'Aplica para convertirte en mentor de la comunidad'}
        />

        {/* Benefits Section - Visible para todos */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            ¿Por qué ser Mentor de Nodo360?
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${benefit.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {isMentor ? (
          /* ===== VISTA MENTOR ===== */
          <>
            {/* Stats mensuales */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                title="Días Activo"
                value={monthlyStats?.days_active || 0}
              />
              <StatCard
                icon={<MessageSquare className="w-5 h-5" />}
                title="Respuestas Comunidad"
                value={monthlyStats?.community_replies || 0}
              />
              <StatCard
                icon={<ClipboardCheck className="w-5 h-5" />}
                title="Revisiones"
                value={monthlyStats?.reviews_completed || 0}
              />
              <StatCard
                icon={<Vote className="w-5 h-5" />}
                title="Votos Emitidos"
                value={monthlyStats?.votes_cast || 0}
              />
            </div>

            {/* Info del mentor */}
            <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-7">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">Estado de Mentor</h2>
                  <p className="text-sm text-gray-400">
                    Mentor desde {mentorProfile?.created_at ? new Date(mentorProfile.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                  Activo
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">{mentorProfile?.total_points || 0}</div>
                  <div className="text-sm text-gray-400">Puntos totales</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">{mentorProfile?.total_sessions || 0}</div>
                  <div className="text-sm text-gray-400">Sesiones totales</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className={`text-2xl font-bold ${(mentorProfile?.warnings || 0) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {mentorProfile?.warnings || 0}/2
                  </div>
                  <div className="text-sm text-gray-400">Avisos activos</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">
                    {nextEvaluation ? nextEvaluation.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Próxima evaluación</div>
                </div>
              </div>

              {(mentorProfile?.warnings || 0) > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tienes {mentorProfile.warnings} aviso(s). Al llegar a 2 se revoca el rol de mentor.
                  </p>
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              {/* Revisar Cursos - Destacado */}
              <Link
                href="/dashboard/mentor/cursos/pendientes"
                className="flex items-center gap-4 p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/40 transition-colors">
                  <ClipboardCheck className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                    Revisar Cursos
                  </h3>
                  <p className="text-sm text-gray-400">Aprueba o rechaza cursos pendientes</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-orange-400/50 rotate-180" />
              </Link>

              <Link
                href="/gobernanza/mentores"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Vote className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-brand-light transition-colors">
                    Votaciones de Mentores
                  </h3>
                  <p className="text-sm text-gray-400">Revisa y vota aplicaciones</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-white/30 rotate-180" />
              </Link>

              <Link
                href="/gobernanza"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                  <Landmark className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-brand-light transition-colors">
                    Gobernanza
                  </h3>
                  <p className="text-sm text-gray-400">Propuestas de la plataforma</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-white/30 rotate-180" />
              </Link>
            </div>
          </>
        ) : (
          /* ===== VISTA NO-MENTOR ===== */
          <>
            {/* Checklist de Requisitos */}
            <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-7">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Requisitos para ser Mentor</h2>
                  <p className="text-sm text-gray-400">Cumple estos requisitos para poder aplicar</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Puntos de mérito */}
                  <RequirementItem
                    passed={meritPoints >= 650}
                    label="Puntos de mérito mínimos"
                    detail={`${meritPoints}/650`}
                  />

                  {/* Instructor certificado */}
                  <RequirementItem
                    passed={hasInstructorCert}
                    label="Instructor certificado"
                    detail={hasInstructorCert ? 'Sí' : 'No'}
                  />

                  {/* Antigüedad de cuenta */}
                  <RequirementItem
                    passed={accountAge >= 3}
                    label="Cuenta activa +3 meses"
                    detail={`${accountAge} meses`}
                  />

                  {/* Sin sanciones */}
                  <RequirementItem
                    passed={true}
                    label="Sin sanciones activas"
                    detail="Limpio"
                  />

                  {/* Plazas disponibles */}
                  <RequirementItem
                    passed={totalMentors < maxMentors}
                    label="Plazas disponibles"
                    detail={`${totalMentors}/${maxMentors} mentores`}
                  />

                  {/* Sin aplicación pendiente */}
                  <RequirementItem
                    passed={eligibility?.no_pending_application && eligibility?.cooldown_passed}
                    label="Sin aplicación pendiente/cooldown"
                    detail={
                      !eligibility?.no_pending_application
                        ? 'Pendiente'
                        : !eligibility?.cooldown_passed
                        ? 'En cooldown'
                        : 'Disponible'
                    }
                  />
                </div>
              </div>

              {/* CTA Button */}
              {eligibility?.can_apply ? (
                <Link
                  href="/dashboard/mentor/aplicar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:opacity-90 rounded-xl text-sm font-medium text-white transition-opacity shadow-lg shadow-orange-500/20"
                >
                  <Star className="w-4 h-4" />
                  Solicitar ser Mentor
                </Link>
              ) : (
                <div>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-sm font-medium text-white/50 cursor-not-allowed"
                  >
                    <Star className="w-4 h-4" />
                    Solicitar ser Mentor
                  </button>
                  <p className="mt-3 text-sm text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {eligibility?.reason || 'No cumples los requisitos para aplicar.'}
                  </p>
                  {meritPoints < 650 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Te faltan {650 - meritPoints} puntos de mérito. Completa cursos y participa en la comunidad para ganar puntos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Historial de aplicaciones */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Historial de Aplicaciones
          </h2>
          {applications && applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app: any) => {
                const statusInfo = getStatusInfo(app.status)
                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(app.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{app.motivation}</p>
                    {app.decision_reason && (
                      <p className="text-xs text-gray-500 mt-2">
                        Razón: {app.decision_reason}
                      </p>
                    )}
                    {app.decision_method && (
                      <p className="text-xs text-gray-600 mt-1">
                        Método: {app.decision_method === 'community_vote' ? 'Voto comunitario' : 'Decisión directa'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              <Clock className="w-10 h-10 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No tienes aplicaciones previas</p>
              <p className="text-sm text-gray-600 mt-1">
                {isMentor ? 'Tu aplicación fue aprobada exitosamente.' : 'Cuando apliques, tu historial aparecerá aquí.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function RequirementItem({
  passed,
  label,
  detail
}: {
  passed: boolean
  label: string
  detail: string
}) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${passed ? 'text-gray-300' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`text-xs ml-auto ${passed ? 'text-green-400' : 'text-gray-500'}`}>
        {detail}
      </span>
    </div>
  )
}
