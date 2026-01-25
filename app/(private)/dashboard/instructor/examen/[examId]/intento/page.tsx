import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamAttemptClient } from './ExamAttemptClient'

export const metadata = {
  title: 'Examen en Curso | Nodo360',
  description: 'Examen de certificación de instructor',
}

export default async function ExamenIntentoPage({
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

  // Verificar elegibilidad
  const { data: canAttemptData } = await supabase
    .rpc('can_attempt_exam', { p_user_id: user.id, p_exam_id: examId })

  const eligibility = canAttemptData?.[0]
  if (!eligibility?.can_attempt) {
    redirect(`/dashboard/instructor/examen/${examId}`)
  }

  // Obtener info del examen
  const { data: exam } = await supabase
    .from('instructor_exams')
    .select('id, title, time_limit_minutes, total_questions, pass_threshold')
    .eq('id', examId)
    .eq('is_active', true)
    .single()

  if (!exam) {
    redirect('/dashboard/instructor')
  }

  // Seleccionar modelo y obtener preguntas
  const { data: modelId } = await supabase
    .rpc('select_exam_model', { p_user_id: user.id, p_exam_id: examId })

  if (!modelId) {
    redirect(`/dashboard/instructor/examen/${examId}`)
  }

  // Obtener preguntas del modelo
  const { data: questions } = await supabase
    .from('instructor_exam_questions')
    .select('id, question, options, order_index, points')
    .eq('model_id', modelId)
    .order('order_index', { ascending: true })

  if (!questions || questions.length === 0) {
    redirect(`/dashboard/instructor/examen/${examId}`)
  }

  return (
    <ExamAttemptClient
      exam={exam}
      examId={examId}
      modelId={modelId}
      questions={questions}
      timeLimitMinutes={exam.time_limit_minutes}
    />
  )
}
