-- =====================================================
-- MIGRATION 017: Sistema de Comentarios en Lecciones
-- =====================================================
-- Permite a estudiantes comentar en lecciones y a
-- instructores/mentores marcar respuestas útiles.
-- Incluye moderación con soft-delete (is_hidden).
-- =====================================================

-- A) Crear tabla lesson_comments
CREATE TABLE public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  is_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE public.lesson_comments IS 'Comentarios de usuarios en lecciones';
COMMENT ON COLUMN public.lesson_comments.is_hidden IS 'Soft-delete para moderación';
COMMENT ON COLUMN public.lesson_comments.is_answer IS 'Marcado como respuesta útil por instructor/mentor';

-- B) Índices
CREATE INDEX idx_lesson_comments_lesson_id_created ON public.lesson_comments(lesson_id, created_at DESC);
CREATE INDEX idx_lesson_comments_user_id ON public.lesson_comments(user_id);

-- C) RLS Policies
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios autenticados ven comentarios no ocultos, admin ve todos
CREATE POLICY "lesson_comments_select"
ON public.lesson_comments FOR SELECT
TO authenticated
USING (
  is_hidden = false
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- INSERT: usuarios autenticados pueden insertar
CREATE POLICY "lesson_comments_insert"
ON public.lesson_comments FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE: autor puede editar su comentario, admin puede editar cualquiera
CREATE POLICY "lesson_comments_update"
ON public.lesson_comments FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- DELETE: solo admin (aunque preferimos usar is_hidden)
CREATE POLICY "lesson_comments_delete"
ON public.lesson_comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- D) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_lesson_comment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lesson_comments_updated_at
BEFORE UPDATE ON public.lesson_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_lesson_comment_updated_at();

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 017: Lesson comments system completed';
END $$;
