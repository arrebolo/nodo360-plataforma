-- =====================================================
-- MIGRATION 016: Sistema de Revisión de Cursos (2 aprobaciones)
-- =====================================================
-- Reemplaza el sistema anterior (019_mentor_course_review.sql) con:
-- - 2 aprobaciones requeridas para publicar
-- - Status 'changes_requested' en vez de 'rejected' terminal
-- - Enum course_review_vote ('approve', 'request_changes')
-- - Constraint UNIQUE(course_id, mentor_id)
-- - Trigger automático para check de aprobaciones
-- =====================================================

-- A) Agregar 'changes_requested' al enum course_status
-- Nota: Si course_status es un check constraint en vez de enum,
-- se debe actualizar el constraint. Como usamos TEXT con validación
-- a nivel de app, solo necesitamos que el valor sea aceptado.
-- Si existe un enum, se altera:
DO $$
BEGIN
  -- Intentar agregar el valor al enum si existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
    BEGIN
      ALTER TYPE course_status ADD VALUE IF NOT EXISTS 'changes_requested';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'course_status enum: changes_requested ya existe o no es enum';
    END;
  END IF;
END $$;

-- B) Crear enum course_review_vote
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_review_vote') THEN
    CREATE TYPE course_review_vote AS ENUM ('approve', 'request_changes');
  END IF;
END $$;

-- C) Drop vieja tabla y funciones de migration 019
DROP FUNCTION IF EXISTS public.submit_course_review(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_course_review_history(UUID) CASCADE;
DROP TABLE IF EXISTS public.course_reviews CASCADE;

-- D) Crear tabla course_reviews con nuevo schema
CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.users(id),
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'request_changes')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_course_review_mentor UNIQUE (course_id, mentor_id)
);

-- Comentarios
COMMENT ON TABLE public.course_reviews IS 'Revisiones de cursos por mentores (2 aprobaciones para publicar)';
COMMENT ON COLUMN public.course_reviews.vote IS 'Voto: approve o request_changes';
COMMENT ON COLUMN public.course_reviews.comment IS 'Comentario del mentor (obligatorio si request_changes)';

-- E) RLS Policies
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: mentores, admins, e instructor dueño del curso
CREATE POLICY "course_reviews_select"
ON public.course_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('mentor', 'admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_reviews.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- INSERT: solo mentores
CREATE POLICY "course_reviews_insert"
ON public.course_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('mentor', 'admin')
  )
  AND mentor_id = auth.uid()
);

-- UPDATE: mentor creador o admin
CREATE POLICY "course_reviews_update"
ON public.course_reviews FOR UPDATE
TO authenticated
USING (
  mentor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- DELETE: mentor creador o admin
CREATE POLICY "course_reviews_delete"
ON public.course_reviews FOR DELETE
TO authenticated
USING (
  mentor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- F) Índices
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX idx_course_reviews_mentor_id ON public.course_reviews(mentor_id);

-- G) Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_course_review_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_course_reviews_updated_at
BEFORE UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_course_review_updated_at();

-- H) Función check_course_approval() como trigger AFTER INSERT OR UPDATE
CREATE OR REPLACE FUNCTION public.check_course_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approve_count INT;
  v_course_status TEXT;
BEGIN
  -- Obtener status actual del curso
  SELECT status INTO v_course_status
  FROM public.courses
  WHERE id = NEW.course_id;

  -- Solo actuar si el curso está en pending_review
  IF v_course_status != 'pending_review' THEN
    RETURN NEW;
  END IF;

  IF NEW.vote = 'approve' THEN
    -- Contar aprobaciones para este curso
    SELECT COUNT(*) INTO v_approve_count
    FROM public.course_reviews
    WHERE course_id = NEW.course_id
    AND vote = 'approve';

    -- Si hay 2 o más aprobaciones, publicar
    IF v_approve_count >= 2 THEN
      UPDATE public.courses
      SET
        status = 'published',
        rejection_reason = NULL,
        published_at = NOW(),
        updated_at = NOW()
      WHERE id = NEW.course_id;

      RAISE NOTICE '[check_course_approval] Course % auto-published with % approvals',
        NEW.course_id, v_approve_count;
    END IF;

  ELSIF NEW.vote = 'request_changes' THEN
    -- Cambiar status a changes_requested
    UPDATE public.courses
    SET
      status = 'changes_requested',
      rejection_reason = NEW.comment,
      updated_at = NOW()
    WHERE id = NEW.course_id;

    RAISE NOTICE '[check_course_approval] Course % marked as changes_requested by mentor %',
      NEW.course_id, NEW.mentor_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_course_approval
AFTER INSERT ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.check_course_approval();

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 016: Mentor course review system (2 approvals) completed';
END $$;
