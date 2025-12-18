// app/api/quiz/attempt/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createQuizAttempt, type QuizQuestionDTO } from '@/lib/db/quiz'

export async function POST(request: Request) {
  const supabase = await createClient()

  const body = await request.json().catch(() => null) as {
    moduleId?: string
    answers?: number[]
    questions?: QuizQuestionDTO[]
  } | null

  if (!body?.moduleId || !Array.isArray(body.answers) || !Array.isArray(body.questions)) {
    return NextResponse.json(
      { error: 'moduleId, answers y questions son requeridos' },
      { status: 400 },
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const result = await createQuizAttempt({
      supabase,
      userId: user.id,
      moduleId: body.moduleId,
      answers: body.answers,
      questions: body.questions,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('❌ [POST /api/quiz/attempt] Error', error)
    return NextResponse.json(
      { error: 'No se ha podido guardar el intento de quiz' },
      { status: 500 },
    )
  }
}
