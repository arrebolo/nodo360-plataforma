import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Award,
  Calendar,
} from 'lucide-react'

export const metadata = {
  title: 'Examen de Certificación | Nodo360',
  description: 'Información del examen de certificación de instructor',
}

export default async function ExamenInfoPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener información del examen
  const { data: exam } = await supabase
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
    .eq('id', examId)
    .eq('is_active', true)
    .single()

  if (!exam) {
    redirect('/dashboard/instructor')
  }

  // Extract learning_paths as a single object (Supabase types it as array)
  const learningPath = exam.learning_paths as unknown as { id: string; title: string; slug: string; icon: string } | null

  // Verificar elegibilidad
  const { data: canAttemptData } = await supabase
    .rpc('can_attempt_exam', { p_user_id: user.id, p_exam_id: examId })

  const eligibility = canAttemptData?.[0] ?? null

  // Verificar si tiene certificación activa
  const { data: activeCert } = await supabase
    .from('instructor_certifications')
    .select('id, certification_number, issued_at, expires_at')
    .eq('user_id', user.id)
    .eq('learning_path_id', exam.learning_path_id)
    .eq('status', 'active')
    .maybeSingle()

  // Obtener historial de intentos
  const { data: attempts } = await supabase
    .from('instructor_exam_attempts')
    .select('id, score, passed, created_at')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .order('created_at', { ascending: false })
    .limit(5)

  const canAttempt = eligibility?.can_attempt === true

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a certificaciones
        </Link>

        {/* Header */}
        <PageHeader
          icon={GraduationCap}
          title={exam.title}
          subtitle={exam.description}
        />

        {/* Certificación activa */}
        {activeCert && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Ya tienes esta certificación activa</p>
                <p className="text-sm text-gray-400">
                  N.° {activeCert.certification_number} · Expira: {new Date(activeCert.expires_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info del examen */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Información del Examen
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <BookOpen className="w-4 h-4" />
                Preguntas
              </div>
              <p className="text-2xl font-bold text-white">{exam.total_questions}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Tiempo Límite
              </div>
              <p className="text-2xl font-bold text-white">{exam.time_limit_minutes} min</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <CheckCircle className="w-4 h-4" />
                Para Aprobar
              </div>
              <p className="text-2xl font-bold text-white">{exam.pass_threshold}%</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Validez
              </div>
              <p className="text-2xl font-bold text-white">{exam.certification_validity_years} año{exam.certification_validity_years > 1 ? 's' : ''}</p>
            </div>
          </div>

  {learningPath && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400">
                Ruta de aprendizaje: <span className="text-brand-light">{learningPath.icon} {learningPath.title}</span>
              </p>
            </div>
          )}
        </div>

        {/* Elegibilidad y acción */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
          {canAttempt ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-light/20 to-brand/10 flex items-center justify-center">
                <PlayCircle className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Estás listo para el examen</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Tendrás {exam.time_limit_minutes} minutos para responder {exam.total_questions} preguntas.
                Necesitas {exam.pass_threshold}% para aprobar.
              </p>
              <Link
                href={`/dashboard/instructor/examen/${examId}/intento`}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-light to-brand hover:opacity-90 rounded-xl text-sm font-medium text-white transition-opacity"
              >
                <PlayCircle className="w-5 h-5" />
                Comenzar Examen
              </Link>
              <p className="text-xs text-gray-500 mt-4">
                Una vez iniciado, el temporizador no se puede pausar.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No puedes intentar este examen</h3>
              <p className="text-gray-400 mb-4">
                {eligibility?.reason || 'No cumples los requisitos actualmente.'}
              </p>
              {eligibility?.next_available_at && (
                <p className="text-sm text-gray-500">
                  Próximo intento disponible: {new Date(eligibility.next_available_at).toLocaleDateString('es-ES')}
                </p>
              )}
              {eligibility?.models_used !== undefined && eligibility?.total_models !== undefined && (
                <p className="text-sm text-gray-500 mt-2">
                  Modelos usados: {eligibility.models_used}/{eligibility.total_models}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Historial de intentos */}
        {attempts && attempts.length > 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Historial de Intentos
            </h2>
            <div className="space-y-3">
              {attempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {attempt.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className={`font-medium ${attempt.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {attempt.passed ? 'Aprobado' : 'No aprobado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(attempt.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{attempt.score}%</p>
                    <p className="text-xs text-gray-500">Puntuación</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
