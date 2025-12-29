-- Migration: user_lesson_notes + course_final_quiz_attempts
-- Purpose:
-- 1) Persistir notas por usuario/lección con RLS
-- 2) Registrar intentos del quiz final de curso

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Tabla: user_lesson_notes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_lesson_notes_user ON public.user_lesson_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_notes_lesson ON public.user_lesson_notes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_notes_course ON public.user_lesson_notes(course_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS user_lesson_notes_updated_at ON public.user_lesson_notes;
CREATE TRIGGER user_lesson_notes_updated_at
  BEFORE UPDATE ON public.user_lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.user_lesson_notes ENABLE ROW LEVEL SECURITY;

-- Solo el propietario puede leer su nota
DROP POLICY IF EXISTS "Users can view own lesson notes" ON public.user_lesson_notes;
CREATE POLICY "Users can view own lesson notes"
  ON public.user_lesson_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el propietario puede insertar su nota
DROP POLICY IF EXISTS "Users can insert own lesson notes" ON public.user_lesson_notes;
CREATE POLICY "Users can insert own lesson notes"
  ON public.user_lesson_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el propietario puede actualizar su nota
DROP POLICY IF EXISTS "Users can update own lesson notes" ON public.user_lesson_notes;
CREATE POLICY "Users can update own lesson notes"
  ON public.user_lesson_notes FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- Tabla: course_final_quiz_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_final_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_course_final_attempts_user ON public.course_final_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_course_final_attempts_course ON public.course_final_quiz_attempts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_final_attempts_completed ON public.course_final_quiz_attempts(completed_at DESC);

-- RLS
ALTER TABLE public.course_final_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own course final quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can view own course final quiz attempts"
  ON public.course_final_quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own course final quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can insert own course final quiz attempts"
  ON public.course_final_quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
