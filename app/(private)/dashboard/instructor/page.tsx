import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import {
  ArrowLeft,
  GraduationCap,
  Award,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Certificaciones Instructor | Nodo360',
  description: 'Exámenes de certificación y credenciales de instructor',
}

export default async function InstructorPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener exámenes disponibles con elegibilidad
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

  // Verificar elegibilidad para cada examen
  const examsWithStatus = await Promise.all(
    (exams || []).map(async (exam) => {
      const { data: canAttempt } = await supabase
        .rpc('can_attempt_exam', { p_user_id: user.id, p_exam_id: exam.id })

      const { data: certification } = await supabase
        .from('instructor_certifications')
        .select('id, status, expires_at, certification_number, issued_at')
        .eq('user_id', user.id)
        .eq('learning_path_id', exam.learning_path_id)
        .eq('status', 'active')
        .maybeSingle()

      return {
        ...exam,
        can_attempt: canAttempt?.[0] ?? null,
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
          icon={GraduationCap}
          title="Certificaciones de Instructor"
          subtitle="Obtén credenciales oficiales para enseñar en Nodo360"
        />

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
                  className="p-5 rounded-2xl bg-gradient-to-br from-brand-light/15 to-brand/10 border border-brand-light/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {cert.learning_paths?.icon || '📜'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {cert.learning_paths?.title || 'Certificación'}
                      </h3>
                      <p className="text-sm text-white/60 mt-1">
                        N.° {cert.certification_number}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
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
            <Card className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-white/30 mb-3" />
              <p className="text-white/50">No hay exámenes disponibles actualmente.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {examsWithStatus.map((exam: any) => {
                const canAttempt = exam.can_attempt?.can_attempt
                const hasCert = !!exam.active_certification

                return (
                  <Card key={exam.id} className="relative overflow-hidden">
                    {hasCert && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          Certificado
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                        {exam.learning_paths?.icon || '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white">{exam.title}</h3>
                        <p className="text-sm text-white/50 mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/40">
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
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {hasCert ? (
                        <p className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Ya tienes esta certificación activa
                        </p>
                      ) : canAttempt ? (
                        <Link
                          href={`/dashboard/instructor/examen/${exam.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-light hover:bg-brand-light/80 rounded-lg text-sm font-medium text-white transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Iniciar Examen
                        </Link>
                      ) : (
                        <div className="text-sm text-white/50">
                          <p className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            {exam.can_attempt?.reason || 'No elegible actualmente'}
                          </p>
                          {exam.can_attempt?.next_available_at && (
                            <p className="mt-1 text-xs text-white/40">
                              Disponible: {new Date(exam.can_attempt.next_available_at).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
