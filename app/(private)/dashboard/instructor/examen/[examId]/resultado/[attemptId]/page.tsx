import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Trophy,
  XCircle,
  Award,
  Clock,
  Target,
  Calendar,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

export const metadata = {
  title: 'Resultado del Examen | Nodo360',
  description: 'Resultado de tu examen de certificación',
}

export default async function ResultadoExamenPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>
}) {
  const { examId, attemptId } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener intento
  const { data: attempt } = await supabase
    .from('instructor_exam_attempts')
    .select(`
      id,
      user_id,
      exam_id,
      model_id,
      score,
      correct_answers,
      total_questions,
      passed,
      time_spent_seconds,
      created_at,
      instructor_exams (
        id,
        title,
        pass_threshold,
        cooldown_days,
        learning_path_id
      )
    `)
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single()

  if (!attempt) {
    redirect('/dashboard/instructor')
  }

  // Extract instructor_exams as a single object (Supabase types it as array)
  const examInfo = attempt.instructor_exams as unknown as {
    id: string
    title: string
    pass_threshold: number
    cooldown_days: number
    learning_path_id: string
  } | null

  // Si aprobó, obtener certificación
  let certification = null
  if (attempt.passed && examInfo?.learning_path_id) {
    const { data: cert } = await supabase
      .from('instructor_certifications')
      .select('id, certification_number, issued_at, expires_at')
      .eq('user_id', user.id)
      .eq('learning_path_id', examInfo.learning_path_id)
      .eq('status', 'active')
      .maybeSingle()

    certification = cert
  }

  // Calcular próximo intento disponible si no aprobó
  let nextAttemptDate = null
  if (!attempt.passed && examInfo?.cooldown_days) {
    const attemptDate = new Date(attempt.created_at)
    attemptDate.setDate(attemptDate.getDate() + examInfo.cooldown_days)
    nextAttemptDate = attemptDate
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a certificaciones
        </Link>

        {/* Resultado principal */}
        <div className={`rounded-2xl p-8 text-center mb-6 ${
          attempt.passed
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30'
            : 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30'
        }`}>
          {attempt.passed ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-green-400 mb-2">
                ¡Felicitaciones!
              </h1>
              <p className="text-xl text-white mb-2">Has aprobado el examen</p>
              <p className="text-gray-400">
                {examInfo?.title}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-red-400 mb-2">
                No aprobado
              </h1>
              <p className="text-xl text-white mb-2">No alcanzaste el puntaje mínimo</p>
              <p className="text-gray-400">
                {examInfo?.title}
              </p>
            </>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
            <Target className="w-6 h-6 mx-auto text-brand-light mb-2" />
            <p className="text-3xl font-bold text-white">{attempt.score}%</p>
            <p className="text-sm text-gray-400">Puntuación</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
            <Award className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-white">
              {attempt.correct_answers}/{attempt.total_questions}
            </p>
            <p className="text-sm text-gray-400">Respuestas correctas</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
            <Clock className="w-6 h-6 mx-auto text-purple-400 mb-2" />
            <p className="text-3xl font-bold text-white">
              {formatTime(attempt.time_spent_seconds || 0)}
            </p>
            <p className="text-sm text-gray-400">Tiempo utilizado</p>
          </div>
        </div>

        {/* Certificación o próximo intento */}
        {attempt.passed && certification ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-light/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-brand-light" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Certificación Obtenida</h2>
                <p className="text-sm text-gray-400">N.° {certification.certification_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Emitida: {new Date(certification.issued_at).toLocaleDateString('es-ES')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Expira: {new Date(certification.expires_at).toLocaleDateString('es-ES')}
              </span>
            </div>
            <Link
              href="/dashboard/certificados"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-light to-brand hover:opacity-90 rounded-lg text-sm font-medium text-white transition-opacity"
            >
              Ver mis certificados
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !attempt.passed && nextAttemptDate && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Próximo Intento</h2>
                <p className="text-sm text-gray-400">
                  Podrás volver a intentarlo a partir del {nextAttemptDate.toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Necesitabas {examInfo?.pass_threshold}% para aprobar.
              Te recomendamos repasar el material del curso antes del próximo intento.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/instructor"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a certificaciones
          </Link>
          {!attempt.passed && (
            <Link
              href={`/dashboard/instructor/examen/${examId}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              Ver detalles del examen
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
