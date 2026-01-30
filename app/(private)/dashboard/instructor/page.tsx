import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import {
  ArrowLeft,
  GraduationCap,
  Award,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  XCircle,
  DollarSign,
  Users,
  Globe,
  BarChart3,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export const metadata = {
  title: 'Certificaciones Instructor | Nodo360',
  description: 'Exámenes de certificación y credenciales de instructor',
}

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Revenue Share 35/65',
    description: 'Gana el 35% de cada venta (40% con referidos)',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    icon: BookOpen,
    title: 'Crea Cursos Premium',
    description: 'Publica contenido de pago en tu especialidad',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    icon: BadgeCheck,
    title: 'Badge Verificado',
    description: 'Distintivo de instructor en tu perfil',
    color: 'text-brand-light',
    bgColor: 'bg-brand/20',
  },
  {
    icon: BarChart3,
    title: 'Panel de Instructor',
    description: 'Dashboard con métricas, estudiantes e ingresos',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    icon: MessageCircle,
    title: 'Comunidad Exclusiva',
    description: 'Acceso al canal privado de instructores',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
  },
  {
    icon: Globe,
    title: 'Perfil Público',
    description: 'Aparece en la página /instructores',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
]

interface EligibilityDetails {
  has_premium: boolean
  premium_status: string
  courses_required: number
  courses_completed: number
  courses_complete: boolean
  quizzes_required: number
  quizzes_passed: number
  quizzes_complete: boolean
  has_active_cert: boolean
  models_used: number
  total_models: number
  in_cooldown: boolean
  cooldown_ends_at: string | null
  can_attempt: boolean
  reason: string
}

export default async function InstructorPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener exámenes disponibles
  const { data: exams } = await supabase
    .from('instructor_exams')
    .select(`
      id,
      title,
      description,
      slug,
      total_questions,
      pass_threshold,
      time_limit_minutes,
      total_models,
      cooldown_days,
      certification_validity_years,
      learning_path_id,
      learning_paths (
        id,
        title,
        slug,
        icon
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Obtener elegibilidad detallada para cada examen
  const examsWithStatus = await Promise.all(
    (exams || []).map(async (exam) => {
      const { data: eligibility } = await supabase
        .rpc('get_exam_eligibility_details', { p_user_id: user.id, p_exam_id: exam.id })

      const { data: certification } = await supabase
        .from('instructor_certifications')
        .select('id, status, expires_at, certification_number, issued_at')
        .eq('user_id', user.id)
        .eq('learning_path_id', exam.learning_path_id)
        .eq('status', 'active')
        .maybeSingle()

      return {
        ...exam,
        eligibility: (eligibility?.[0] as EligibilityDetails) ?? null,
        active_certification: certification ?? null,
      }
    })
  )

  // Obtener todas las certificaciones del usuario
  const { data: certifications } = await supabase
    .from('instructor_certifications')
    .select(`
      id,
      status,
      expires_at,
      issued_at,
      certification_number,
      learning_path_id,
      learning_paths (
        title,
        icon
      )
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  const activeCerts = certifications?.filter(c => c.status === 'active') || []
  const expiredCerts = certifications?.filter(c => c.status === 'expired') || []

  // Check if user has any published courses (for onboarding banner)
  const { data: publishedCourses } = await supabase
    .from('courses')
    .select('id')
    .eq('instructor_id', user.id)
    .eq('status', 'published')
    .limit(1)

  const hasPublishedCourses = (publishedCourses?.length ?? 0) > 0

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

        {/* Onboarding Banner for new instructors */}
        {!hasPublishedCourses && (
          <div className="mb-6 p-5 rounded-2xl border border-brand-light/30 bg-gradient-to-r from-brand-light/10 via-brand/5 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-brand-light/20 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-brand-light" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    ¿Nuevo como instructor?
                  </h3>
                  <p className="text-sm text-white/60 mt-0.5">
                    Sigue nuestra guia paso a paso para crear y publicar tu primer curso
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/instructor/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Comenzar onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <PageHeader
          icon={GraduationCap}
          title="Certificaciones de Instructor"
          subtitle="Obtén credenciales oficiales para enseñar en Nodo360"
        />

        {/* Benefits Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand" />
            ¿Por qué ser Instructor Certificado?
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

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            icon={<Award className="w-5 h-5" />}
            title="Certificaciones Activas"
            value={activeCerts.length}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Exámenes Disponibles"
            value={examsWithStatus.length}
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Aprobados"
            value={activeCerts.length + expiredCerts.length}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            title="Expiradas"
            value={expiredCerts.length}
          />
        </div>

        {/* Certificaciones Activas */}
        {activeCerts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand" />
              Mis Certificaciones
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeCerts.map((cert: any) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-brand-light/15 to-brand/10 border border-brand-light/30 hover:border-brand-light/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {cert.learning_paths?.icon || '📜'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {cert.learning_paths?.title || 'Certificación'}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        N.° {cert.certification_number}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Emitida: {new Date(cert.issued_at).toLocaleDateString('es-ES')}</span>
                        <span>Expira: {new Date(cert.expires_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                      Activa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exámenes Disponibles */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Exámenes de Certificación
          </h2>
          {examsWithStatus.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">No hay exámenes disponibles aún</p>
              <p className="text-sm text-gray-600 mt-1">
                Los exámenes de certificación aparecerán aquí cuando estén disponibles.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {examsWithStatus.map((exam: any) => {
                const eligibility = exam.eligibility as EligibilityDetails | null
                const hasCert = !!exam.active_certification
                const canAttempt = eligibility?.can_attempt ?? false

                return (
                  <div
                    key={exam.id}
                    className="relative rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-white/20 transition-colors"
                  >
                    {hasCert && (
                      <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          Certificado
                        </span>
                      </div>
                    )}

                    {/* Exam Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                        {exam.learning_paths?.icon || '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-lg">{exam.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {exam.description}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {exam.total_questions} preguntas
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exam.time_limit_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {exam.pass_threshold}% para aprobar
                          </span>
                        </div>
                        {exam.learning_paths && (
                          <p className="text-xs text-brand-light mt-2">
                            Ruta: {exam.learning_paths.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    {!hasCert && eligibility && (
                      <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <h4 className="text-sm font-medium text-white mb-3">Requisitos para el examen</h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {/* Premium Subscription */}
                          <RequirementItem
                            passed={eligibility.has_premium}
                            label="Suscripción Premium activa"
                            detail={eligibility.premium_status}
                          />

                          {/* Courses Completed */}
                          <RequirementItem
                            passed={eligibility.courses_complete}
                            label="Cursos de la ruta completados"
                            detail={`${eligibility.courses_completed}/${eligibility.courses_required}`}
                          />

                          {/* Quizzes Passed */}
                          <RequirementItem
                            passed={eligibility.quizzes_complete}
                            label="Quiz final aprobado"
                            detail={eligibility.quizzes_required > 0 ? `${eligibility.quizzes_passed}/${eligibility.quizzes_required}` : 'N/A'}
                          />

                          {/* No Active Certification */}
                          <RequirementItem
                            passed={!eligibility.has_active_cert}
                            label="Sin certificación activa"
                            detail={eligibility.has_active_cert ? 'Ya certificado' : 'Disponible'}
                          />

                          {/* Models Available */}
                          <RequirementItem
                            passed={eligibility.models_used < eligibility.total_models}
                            label="Intentos disponibles"
                            detail={`${eligibility.total_models - eligibility.models_used}/${eligibility.total_models} modelos`}
                          />

                          {/* Not in Cooldown */}
                          <RequirementItem
                            passed={!eligibility.in_cooldown}
                            label="Sin período de espera"
                            detail={eligibility.in_cooldown && eligibility.cooldown_ends_at
                              ? `Hasta ${new Date(eligibility.cooldown_ends_at).toLocaleDateString('es-ES')}`
                              : 'Disponible'
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Area */}
                    <div className="pt-4 border-t border-white/10">
                      {hasCert ? (
                        <p className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Ya tienes esta certificación activa
                        </p>
                      ) : canAttempt ? (
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/dashboard/instructor/examen/${exam.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-light to-brand hover:opacity-90 rounded-lg text-sm font-medium text-white transition-opacity"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Iniciar Examen
                          </Link>
                          <span className="text-xs text-gray-500">
                            {eligibility?.total_models && eligibility?.models_used !== undefined
                              ? `${eligibility.total_models - eligibility.models_used} intentos restantes`
                              : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="flex items-center gap-2 text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            {eligibility?.reason || 'No elegible actualmente'}
                          </p>
                          {!eligibility?.has_premium && (
                            <Link
                              href="/pricing"
                              className="inline-flex items-center gap-1 mt-2 text-xs text-brand-light hover:text-brand transition-colors"
                            >
                              Ver planes premium →
                            </Link>
                          )}
                          {eligibility?.has_premium && !eligibility?.courses_complete && exam.learning_paths?.slug && (
                            <Link
                              href={`/rutas/${exam.learning_paths.slug}`}
                              className="inline-flex items-center gap-1 mt-2 text-xs text-brand-light hover:text-brand transition-colors"
                            >
                              Ver ruta de aprendizaje →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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
