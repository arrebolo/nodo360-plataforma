-- =====================================================
-- MIGRATION 019: Sistema de Revisión de Cursos por Mentores
-- =====================================================
-- Añade soporte para que mentores revisen y aprueben/rechacen cursos:
-- - Tabla course_reviews para historial de revisiones
-- - Función submit_course_review para procesar decisiones
-- - RLS policies para acceso apropiado
-- =====================================================

-- Tabla de revisiones de cursos
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_reviewer_id ON public.course_reviews(reviewer_id);

-- Comentarios
COMMENT ON TABLE public.course_reviews IS 'Historial de revisiones de cursos por mentores/admins';
COMMENT ON COLUMN public.course_reviews.decision IS 'Decisión: approved o rejected';
COMMENT ON COLUMN public.course_reviews.feedback IS 'Feedback proporcionado, especialmente en rechazos';

-- RLS
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Mentores y admins pueden ver todas las revisiones
CREATE POLICY "Mentores y admins pueden ver revisiones"
ON public.course_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('mentor', 'admin')
  )
);

-- Policy: Instructores pueden ver revisiones de sus propios cursos
CREATE POLICY "Instructores pueden ver revisiones de sus cursos"
ON public.course_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_reviews.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- =====================================================
-- FUNCIÓN: submit_course_review
-- =====================================================
-- Procesa la decisión de un mentor/admin sobre un curso
-- Parámetros:
--   p_course_id: ID del curso a revisar
--   p_reviewer_id: ID del mentor/admin que revisa
--   p_decision: 'approved' o 'rejected'
--   p_feedback: Feedback opcional (requerido si rejected)
-- Retorna:
--   { success: boolean, error?: string }
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_course_review(
  p_course_id UUID,
  p_reviewer_id UUID,
  p_decision TEXT,
  p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course RECORD;
  v_reviewer_role TEXT;
  v_new_status TEXT;
BEGIN
  -- 1. Verificar que el revisor tiene permisos (mentor o admin)
  SELECT role INTO v_reviewer_role
  FROM public.users
  WHERE id = p_reviewer_id;

  IF v_reviewer_role IS NULL OR v_reviewer_role NOT IN ('mentor', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para revisar cursos'
    );
  END IF;

  -- 2. Verificar que el curso existe y está pendiente de revisión
  SELECT id, status, title, instructor_id
  INTO v_course
  FROM public.courses
  WHERE id = p_course_id;

  IF v_course IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Curso no encontrado'
    );
  END IF;

  IF v_course.status != 'pending_review' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este curso no está pendiente de revisión'
    );
  END IF;

  -- 3. Validar decisión
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Decisión inválida. Debe ser approved o rejected'
    );
  END IF;

  -- 4. Validar feedback si es rechazo
  IF p_decision = 'rejected' AND (p_feedback IS NULL OR length(trim(p_feedback)) < 10) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Debes proporcionar un motivo de rechazo (mínimo 10 caracteres)'
    );
  END IF;

  -- 5. Registrar la revisión
  INSERT INTO public.course_reviews (
    course_id,
    reviewer_id,
    decision,
    feedback
  ) VALUES (
    p_course_id,
    p_reviewer_id,
    p_decision,
    p_feedback
  );

  -- 6. Actualizar el curso según la decisión
  IF p_decision = 'approved' THEN
    v_new_status := 'published';

    UPDATE public.courses
    SET
      status = v_new_status,
      rejection_reason = NULL,
      updated_at = NOW()
    WHERE id = p_course_id;

  ELSE -- rejected
    v_new_status := 'rejected';

    UPDATE public.courses
    SET
      status = v_new_status,
      rejection_reason = p_feedback,
      updated_at = NOW()
    WHERE id = p_course_id;
  END IF;

  -- 7. Log
  RAISE NOTICE '[submit_course_review] Course % % by reviewer %. New status: %',
    p_course_id, p_decision, p_reviewer_id, v_new_status;

  RETURN jsonb_build_object(
    'success', true,
    'decision', p_decision,
    'new_status', v_new_status
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[submit_course_review] Error: %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.submit_course_review TO authenticated;

-- =====================================================
-- FUNCIÓN: get_course_review_history
-- =====================================================
-- Obtiene el historial de revisiones de un curso
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_course_review_history(p_course_id UUID)
RETURNS TABLE (
  review_id UUID,
  reviewer_name TEXT,
  decision TEXT,
  feedback TEXT,
  reviewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    u.full_name,
    cr.decision,
    cr.feedback,
    cr.created_at
  FROM public.course_reviews cr
  JOIN public.users u ON u.id = cr.reviewer_id
  WHERE cr.course_id = p_course_id
  ORDER BY cr.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_course_review_history TO authenticated;

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 019: Mentor course review system completed';
END $$;
