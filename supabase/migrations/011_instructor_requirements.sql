-- =====================================================
-- MIGRACIÓN 011: REQUISITOS ADICIONALES PARA EXAMEN DE INSTRUCTOR
-- =====================================================
-- Fecha: 2026-01-26
-- Descripción: Añade verificaciones de suscripción premium,
--   cursos completados y quiz final aprobado antes de permitir
--   intentar el examen de certificación de instructor.
-- =====================================================


-- #####################################################
-- SECCIÓN 1: FUNCIÓN AUXILIAR - Verificar cursos completados de ruta
-- #####################################################

CREATE OR REPLACE FUNCTION public.get_path_completion_status(
  p_user_id UUID,
  p_learning_path_id UUID
)
RETURNS TABLE (
  required_courses INTEGER,
  completed_courses INTEGER,
  is_complete BOOLEAN
) AS $$
DECLARE
  v_required INTEGER;
  v_completed INTEGER;
BEGIN
  -- Contar cursos requeridos en la ruta
  SELECT COUNT(*) INTO v_required
  FROM public.path_courses
  WHERE path_id = p_learning_path_id AND is_required = true;

  -- Contar cursos completados por el usuario
  SELECT COUNT(*) INTO v_completed
  FROM public.path_courses pc
  JOIN public.course_enrollments ce ON ce.course_id = pc.course_id
  WHERE pc.path_id = p_learning_path_id
    AND pc.is_required = true
    AND ce.user_id = p_user_id
    AND ce.completed_at IS NOT NULL;

  RETURN QUERY SELECT v_required, v_completed, (v_completed >= v_required AND v_required > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 2: FUNCIÓN AUXILIAR - Verificar quiz final de cursos
-- #####################################################

CREATE OR REPLACE FUNCTION public.get_path_quiz_status(
  p_user_id UUID,
  p_learning_path_id UUID
)
RETURNS TABLE (
  courses_with_quiz INTEGER,
  quizzes_passed INTEGER,
  all_passed BOOLEAN
) AS $$
DECLARE
  v_courses_with_quiz INTEGER;
  v_quizzes_passed INTEGER;
BEGIN
  -- Contar cursos requeridos que tienen quiz final habilitado
  SELECT COUNT(*) INTO v_courses_with_quiz
  FROM public.path_courses pc
  JOIN public.courses c ON c.id = pc.course_id
  WHERE pc.path_id = p_learning_path_id
    AND pc.is_required = true
    AND c.has_final_quiz = true;

  -- Contar quizzes finales aprobados por el usuario
  SELECT COUNT(DISTINCT cfqa.course_id) INTO v_quizzes_passed
  FROM public.course_final_quiz_attempts cfqa
  JOIN public.path_courses pc ON pc.course_id = cfqa.course_id
  JOIN public.courses c ON c.id = pc.course_id
  WHERE pc.path_id = p_learning_path_id
    AND pc.is_required = true
    AND c.has_final_quiz = true
    AND cfqa.user_id = p_user_id
    AND cfqa.passed = true;

  -- Si no hay cursos con quiz, se considera aprobado
  IF v_courses_with_quiz = 0 THEN
    RETURN QUERY SELECT 0, 0, true;
  ELSE
    RETURN QUERY SELECT v_courses_with_quiz, v_quizzes_passed, (v_quizzes_passed >= v_courses_with_quiz);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 3: ACTUALIZAR can_attempt_exam CON NUEVOS REQUISITOS
-- #####################################################

CREATE OR REPLACE FUNCTION public.can_attempt_exam(p_user_id UUID, p_exam_id UUID)
RETURNS TABLE (
  can_attempt BOOLEAN,
  reason TEXT,
  next_available_at TIMESTAMPTZ,
  models_used INTEGER,
  total_models INTEGER
) AS $$
DECLARE
  v_last_attempt RECORD;
  v_exam RECORD;
  v_models_used INTEGER;
  v_total_models INTEGER;
  v_next_available TIMESTAMPTZ;
  v_path_status RECORD;
  v_quiz_status RECORD;
BEGIN
  -- =====================================================
  -- PASO 1: Obtener configuración del examen
  -- =====================================================
  SELECT * INTO v_exam FROM public.instructor_exams WHERE id = p_exam_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Examen no encontrado o inactivo'::TEXT, NULL::TIMESTAMPTZ, 0, 0;
    RETURN;
  END IF;

  v_total_models := v_exam.total_models;

  -- =====================================================
  -- PASO 2: Verificar suscripción premium activa
  -- =====================================================
  IF NOT public.has_premium_access(p_user_id) THEN
    RETURN QUERY SELECT
      false,
      'Requiere suscripción premium activa para acceder al examen'::TEXT,
      NULL::TIMESTAMPTZ,
      0,
      v_total_models;
    RETURN;
  END IF;

  -- =====================================================
  -- PASO 3: Verificar cursos de la ruta completados
  -- =====================================================
  SELECT * INTO v_path_status FROM public.get_path_completion_status(p_user_id, v_exam.learning_path_id);

  IF NOT v_path_status.is_complete THEN
    RETURN QUERY SELECT
      false,
      format('Debes completar todos los cursos de la ruta antes de intentar el examen (%s/%s completados)',
             v_path_status.completed_courses, v_path_status.required_courses)::TEXT,
      NULL::TIMESTAMPTZ,
      0,
      v_total_models;
    RETURN;
  END IF;

  -- =====================================================
  -- PASO 4: Verificar quiz final aprobado en cada curso
  -- =====================================================
  SELECT * INTO v_quiz_status FROM public.get_path_quiz_status(p_user_id, v_exam.learning_path_id);

  IF NOT v_quiz_status.all_passed THEN
    RETURN QUERY SELECT
      false,
      format('Debes aprobar el quiz final de todos los cursos de la ruta (%s/%s aprobados)',
             v_quiz_status.quizzes_passed, v_quiz_status.courses_with_quiz)::TEXT,
      NULL::TIMESTAMPTZ,
      0,
      v_total_models;
    RETURN;
  END IF;

  -- =====================================================
  -- PASO 5: Verificar si ya tiene certificación activa
  -- =====================================================
  IF EXISTS (
    SELECT 1 FROM public.instructor_certifications
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'active' AND expires_at > NOW()
  ) THEN
    RETURN QUERY SELECT false, 'Ya tienes una certificación activa para esta ruta'::TEXT, NULL::TIMESTAMPTZ, 0, v_total_models;
    RETURN;
  END IF;

  -- =====================================================
  -- PASO 6: Contar modelos ya usados
  -- =====================================================
  SELECT COUNT(DISTINCT model_id) INTO v_models_used
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed';

  -- Si agotó todos los modelos, cooldown de 6 meses desde último intento
  IF v_models_used >= v_total_models THEN
    SELECT completed_at INTO v_next_available
    FROM public.instructor_exam_attempts
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1;

    v_next_available := v_next_available + (v_exam.exhausted_cooldown_months || ' months')::INTERVAL;

    IF v_next_available > NOW() THEN
      RETURN QUERY SELECT false, 'Has agotado todos los modelos. Debes esperar 6 meses.'::TEXT, v_next_available, v_models_used, v_total_models;
      RETURN;
    ELSE
      v_models_used := 0;
    END IF;
  END IF;

  -- =====================================================
  -- PASO 7: Verificar cooldown tras intento fallido (15 días)
  -- =====================================================
  SELECT * INTO v_last_attempt
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
  ORDER BY completed_at DESC LIMIT 1;

  IF FOUND AND NOT v_last_attempt.passed THEN
    v_next_available := v_last_attempt.completed_at + (v_exam.cooldown_days || ' days')::INTERVAL;
    IF v_next_available > NOW() THEN
      RETURN QUERY SELECT false, 'Debes esperar el período de cooldown.'::TEXT, v_next_available, v_models_used, v_total_models;
      RETURN;
    END IF;
  END IF;

  -- =====================================================
  -- PASO 8: Puede intentar el examen
  -- =====================================================
  RETURN QUERY SELECT true, 'Puedes intentar el examen'::TEXT, NULL::TIMESTAMPTZ, v_models_used, v_total_models;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 4: AÑADIR COLUMNA has_final_quiz SI NO EXISTE
-- #####################################################

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'courses'
    AND column_name = 'has_final_quiz'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN has_final_quiz BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.courses.has_final_quiz IS 'Indica si el curso tiene quiz final obligatorio';
  END IF;
END $$;


-- #####################################################
-- SECCIÓN 5: FUNCIÓN PARA CONSULTAR ELEGIBILIDAD DETALLADA
-- #####################################################

CREATE OR REPLACE FUNCTION public.get_exam_eligibility_details(
  p_user_id UUID,
  p_exam_id UUID
)
RETURNS TABLE (
  has_premium BOOLEAN,
  premium_status TEXT,
  courses_required INTEGER,
  courses_completed INTEGER,
  courses_complete BOOLEAN,
  quizzes_required INTEGER,
  quizzes_passed INTEGER,
  quizzes_complete BOOLEAN,
  has_active_cert BOOLEAN,
  models_used INTEGER,
  total_models INTEGER,
  in_cooldown BOOLEAN,
  cooldown_ends_at TIMESTAMPTZ,
  can_attempt BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_exam RECORD;
  v_path_status RECORD;
  v_quiz_status RECORD;
  v_attempt_status RECORD;
  v_has_premium BOOLEAN;
  v_has_cert BOOLEAN;
  v_models_used INTEGER;
  v_in_cooldown BOOLEAN := false;
  v_cooldown_ends TIMESTAMPTZ;
  v_can_attempt BOOLEAN := true;
  v_reason TEXT := 'Elegible para el examen';
BEGIN
  -- Obtener examen
  SELECT * INTO v_exam FROM public.instructor_exams WHERE id = p_exam_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false, 'N/A'::TEXT, 0, 0, false, 0, 0, false, false, 0, 0, false, NULL::TIMESTAMPTZ, false, 'Examen no encontrado'::TEXT;
    RETURN;
  END IF;

  -- Verificar premium
  v_has_premium := public.has_premium_access(p_user_id);

  -- Verificar cursos completados
  SELECT * INTO v_path_status FROM public.get_path_completion_status(p_user_id, v_exam.learning_path_id);

  -- Verificar quizzes
  SELECT * INTO v_quiz_status FROM public.get_path_quiz_status(p_user_id, v_exam.learning_path_id);

  -- Verificar certificación activa
  v_has_cert := EXISTS (
    SELECT 1 FROM public.instructor_certifications
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'active' AND expires_at > NOW()
  );

  -- Modelos usados
  SELECT COUNT(DISTINCT model_id) INTO v_models_used
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed';

  -- Cooldown
  SELECT * INTO v_attempt_status
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
  ORDER BY completed_at DESC LIMIT 1;

  IF v_attempt_status IS NOT NULL AND NOT v_attempt_status.passed THEN
    v_cooldown_ends := v_attempt_status.completed_at + (v_exam.cooldown_days || ' days')::INTERVAL;
    v_in_cooldown := v_cooldown_ends > NOW();
  END IF;

  -- Determinar elegibilidad y razón
  IF NOT v_has_premium THEN
    v_can_attempt := false;
    v_reason := 'Requiere suscripción premium';
  ELSIF NOT v_path_status.is_complete THEN
    v_can_attempt := false;
    v_reason := format('Cursos incompletos: %s/%s', v_path_status.completed_courses, v_path_status.required_courses);
  ELSIF NOT v_quiz_status.all_passed THEN
    v_can_attempt := false;
    v_reason := format('Quizzes pendientes: %s/%s', v_quiz_status.quizzes_passed, v_quiz_status.courses_with_quiz);
  ELSIF v_has_cert THEN
    v_can_attempt := false;
    v_reason := 'Ya tiene certificación activa';
  ELSIF v_in_cooldown THEN
    v_can_attempt := false;
    v_reason := 'En período de cooldown';
  ELSIF v_models_used >= v_exam.total_models THEN
    v_can_attempt := false;
    v_reason := 'Agotó todos los modelos';
  END IF;

  RETURN QUERY SELECT
    v_has_premium,
    CASE WHEN v_has_premium THEN 'Activa' ELSE 'Inactiva' END::TEXT,
    v_path_status.required_courses,
    v_path_status.completed_courses,
    v_path_status.is_complete,
    v_quiz_status.courses_with_quiz,
    v_quiz_status.quizzes_passed,
    v_quiz_status.all_passed,
    v_has_cert,
    v_models_used,
    v_exam.total_models,
    v_in_cooldown,
    v_cooldown_ends,
    v_can_attempt,
    v_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 6: COMENTARIOS
-- #####################################################

COMMENT ON FUNCTION public.get_path_completion_status IS 'Retorna estado de completación de cursos requeridos de una ruta para un usuario';
COMMENT ON FUNCTION public.get_path_quiz_status IS 'Retorna estado de quizzes finales aprobados de una ruta para un usuario';
COMMENT ON FUNCTION public.can_attempt_exam IS 'Verifica si usuario puede intentar examen de instructor (premium, cursos, quizzes, cooldowns)';
COMMENT ON FUNCTION public.get_exam_eligibility_details IS 'Retorna detalles completos de elegibilidad para debugging y UI';


-- #####################################################
-- SECCIÓN 7: VERIFICACIÓN
-- #####################################################

DO $$
BEGIN
  -- Verificar que las funciones existen
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_attempt_exam') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_path_completion_status') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_path_quiz_status') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_exam_eligibility_details') THEN
    RAISE NOTICE '✅ Migración 011 aplicada correctamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Funciones no creadas correctamente';
  END IF;
END $$;
