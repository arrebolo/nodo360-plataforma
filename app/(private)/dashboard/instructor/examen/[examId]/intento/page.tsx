import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ExamAttemptClient } from './ExamAttemptClient'

/** Las mismas 15 que sirve la ruta de attempt. */
const PREGUNTAS_POR_INTENTO = 15

export const metadata = {
  title: 'Examen en Curso',
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

  // LAS PREGUNTAS, DEL BANCO Y POR LA MISMA PUERTA QUE LA API.
  //
  // Aqui habia un segundo camino, y roto por dos motivos: llamaba a
  // select_exam_model() —que reparte modelos, y el banco ya no va por modelos— y
  // leia las preguntas con el cliente de SESION, que desde la 087 no puede leer
  // el banco. Es decir: esta pantalla no podia funcionar.
  //
  // Ahora usa servir_preguntas() con el cliente de servicio, igual que la ruta
  // de attempt: crea el intento, elige 15 que esta persona no ha visto y apunta
  // cuales le tocaron, todo en una operacion.
  const banco = createAdminClient() as unknown as SupabaseClient
  const { data: servidas, error: errorServir } = await banco.rpc('servir_preguntas', {
    p_user_id: user.id,
    p_exam_id: examId,
    p_cuantas: PREGUNTAS_POR_INTENTO,
  })

  if (errorServir || !servidas || servidas.length === 0) {
    // P0001: agoto el banco. Se vuelve a la ficha del examen, que es donde se
    // explica por que no puede empezar.
    console.error('[examen/intento] No se pudieron servir preguntas:', errorServir)
    redirect(`/dashboard/instructor/examen/${examId}`)
  }

  const servidasTipadas = servidas as Array<{
    attempt_id: string
    question_id: string
    posicion: number
    question: string
    options: string[]
    points: number
  }>

  return (
    <ExamAttemptClient
      exam={exam}
      examId={examId}
      attemptId={servidasTipadas[0].attempt_id}
      questions={servidasTipadas.map((q) => ({
        id: q.question_id,
        question: q.question,
        options: q.options,
        order_index: q.posicion,
        points: q.points,
      }))}
      timeLimitMinutes={exam.time_limit_minutes}
    />
  )
}
