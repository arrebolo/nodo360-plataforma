-- ============================================================================
-- 034 APLICAR — la identidad sale de la sesión, no del parámetro
--
-- La 033 cerró el acceso anónimo, pero dejó a authenticated EXECUTE sobre 17
-- funciones porque el código las necesita. Todas recibían un identificador del
-- llamante (p_user_id, p_voter_id) en lugar de usar auth.uid(), así que
-- cualquier usuario con sesión podía actuar en nombre de otro. Esto lo cierra.
--
-- Los cuerpos NO se han reescrito a mano: se han tomado de pg_get_functiondef
-- y se les ha insertado la guarda después del BEGIN. Lo que había sigue
-- exactamente igual, tildes incluidas.
--
-- PATRÓN, el mismo de get_unread_message_count en la 031:
--   escritura  ->  si auth.uid() no es nulo y no coincide, 42501. Sin
--                  excepción de admin: un admin tampoco vota por otro.
--   lectura    ->  igual, pero el admin sí puede consultar datos ajenos.
--   En ambos casos auth.uid() nulo pasa: eso es service_role, porque anon ya
--   no puede ejecutarlas desde la 033.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ayudante: ¿es admin quien está llamando?
--    Nace con search_path y sin EXECUTE para PUBLIC, que es la regla nueva.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.es_admin_actual()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users u
                  WHERE u.id = auth.uid() AND u.role = 'admin')
      OR EXISTS (SELECT 1 FROM public.user_roles ur
                  WHERE ur.user_id = auth.uid()
                    AND ur.role::TEXT = 'admin' AND ur.is_active);
$$;

REVOKE ALL ON FUNCTION public.es_admin_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.es_admin_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.es_admin_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_admin_actual() TO service_role;


-- ----------------------------------------------------------------------------
-- 2. Escriben: la identidad sale de la sesión
--
--    vote_mentor_application ya comprobaba que el votante fuese mentor activo
--    y que no votara su propia solicitud, pero lo hacía sobre el p_voter_id
--    QUE LE PASABAN: cualquiera con sesión podía emitir un voto en nombre de
--    un mentor real. Igual con las demás.
--
--    get_or_create_conversation creaba conversaciones entre DOS usuarios
--    arbitrarios sin que el llamante fuera ninguno de los dos.
--
--    mark_messages_as_read, además de fiarse del p_user_id, no comprobaba que
--    quien llama participe en la conversación. Se añaden las dos cosas.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.vote_mentor_application(p_voter_id uuid, p_application_id uuid, p_vote text, p_comment text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_app RECORD;
  v_is_mentor BOOLEAN;
BEGIN

  -- GUARDA 034: la identidad sale de la sesion, no del parametro.
  -- auth.uid() NULL significa service_role (anon ya no puede ejecutarla desde
  -- la 033), y ese caso se deja pasar para los procesos del servidor.
  IF auth.uid() IS NOT NULL AND p_voter_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  -- Verificar que es mentor activo
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id = p_voter_id AND role = 'mentor' AND is_active = true
  ) INTO v_is_mentor;

  IF NOT v_is_mentor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo mentores pueden votar');
  END IF;

  -- Verificar aplicación
  SELECT * INTO v_app FROM public.mentor_applications WHERE id = p_application_id;

  IF v_app IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aplicación no encontrada');
  END IF;

  IF v_app.status != 'voting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'La votación no está activa');
  END IF;

  IF v_app.voting_ends_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'La votación ha expirado');
  END IF;

  IF v_app.user_id = p_voter_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes votar en tu propia aplicación');
  END IF;

  -- Insertar o actualizar voto
  INSERT INTO public.mentor_application_votes (application_id, voter_id, vote, comment)
  VALUES (p_application_id, p_voter_id, p_vote, p_comment)
  ON CONFLICT (application_id, voter_id) DO UPDATE SET
    vote = EXCLUDED.vote,
    comment = EXCLUDED.comment;

  -- Actualizar contadores
  UPDATE public.mentor_applications SET
    votes_for = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'for'),
    votes_against = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'against'),
    votes_abstain = (SELECT COUNT(*) FROM public.mentor_application_votes WHERE application_id = p_application_id AND vote = 'abstain')
  WHERE id = p_application_id;

  RETURN jsonb_build_object('success', true, 'message', 'Voto registrado');
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_mentor_application(p_user_id uuid, p_motivation text, p_experience text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_can_apply JSONB;
  v_points INTEGER;
  v_mentor_count INTEGER;
  v_threshold INTEGER;
  v_app_id UUID;
  v_method TEXT;
BEGIN

  -- GUARDA 034: la identidad sale de la sesion, no del parametro.
  -- auth.uid() NULL significa service_role (anon ya no puede ejecutarla desde
  -- la 033), y ese caso se deja pasar para los procesos del servidor.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  -- Verificar elegibilidad
  v_can_apply := public.can_apply_mentor(p_user_id);
  IF NOT (v_can_apply->>'can_apply')::BOOLEAN THEN
    RETURN v_can_apply;
  END IF;

  v_points := public.get_mentor_points(p_user_id);

  -- Determinar método de decisión
  SELECT COUNT(*) INTO v_mentor_count FROM public.user_roles WHERE role = 'mentor' AND is_active = true;
  SELECT (config_value)::INTEGER INTO v_threshold FROM public.mentor_config WHERE config_key = 'voting_threshold';

  IF v_mentor_count < v_threshold THEN
    v_method := 'admin_designation';
  ELSE
    v_method := 'secret_vote';
  END IF;

  -- Crear aplicación
  INSERT INTO public.mentor_applications (
    user_id, points_at_application, motivation, experience,
    status, decision_method, voting_starts_at, voting_ends_at, total_eligible_voters
  ) VALUES (
    p_user_id, v_points, p_motivation, p_experience,
    CASE WHEN v_method = 'admin_designation' THEN 'pending' ELSE 'voting' END,
    v_method,
    CASE WHEN v_method = 'secret_vote' THEN NOW() ELSE NULL END,
    CASE WHEN v_method = 'secret_vote' THEN NOW() + INTERVAL '14 days' ELSE NULL END,
    CASE WHEN v_method = 'secret_vote' THEN v_mentor_count ELSE NULL END
  ) RETURNING id INTO v_app_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', v_app_id,
    'decision_method', v_method,
    'message', CASE WHEN v_method = 'admin_designation'
      THEN 'Aplicación enviada. Un administrador revisará tu solicitud.'
      ELSE 'Aplicación enviada. Los mentores votarán durante 14 días.'
    END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.select_exam_model(p_user_id uuid, p_exam_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_model_id UUID;
  v_models_used UUID[];
  v_exhausted_cooldown_months INTEGER;
  v_last_exhausted_at TIMESTAMPTZ;
BEGIN

  -- GUARDA 034: la identidad sale de la sesion, no del parametro.
  -- auth.uid() NULL significa service_role (anon ya no puede ejecutarla desde
  -- la 033), y ese caso se deja pasar para los procesos del servidor.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT exhausted_cooldown_months INTO v_exhausted_cooldown_months
  FROM public.instructor_exams WHERE id = p_exam_id;

  SELECT ARRAY_AGG(DISTINCT model_id) INTO v_models_used
  FROM public.instructor_exam_attempts
  WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed';

  -- Si ya usó todos, verificar si pasó el cooldown para resetear
  IF v_models_used IS NOT NULL AND array_length(v_models_used, 1) >= 10 THEN
    SELECT completed_at INTO v_last_exhausted_at
    FROM public.instructor_exam_attempts
    WHERE user_id = p_user_id AND exam_id = p_exam_id AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1;

    IF v_last_exhausted_at + (v_exhausted_cooldown_months || ' months')::INTERVAL <= NOW() THEN
      v_models_used := NULL;
    ELSE
      RETURN NULL;
    END IF;
  END IF;

  -- Seleccionar modelo aleatorio no usado
  IF v_models_used IS NULL THEN
    SELECT id INTO v_model_id
    FROM public.instructor_exam_models
    WHERE exam_id = p_exam_id AND is_active = true
    ORDER BY random() LIMIT 1;
  ELSE
    SELECT id INTO v_model_id
    FROM public.instructor_exam_models
    WHERE exam_id = p_exam_id AND is_active = true
    AND id != ALL(v_models_used)
    ORDER BY random() LIMIT 1;
  END IF;

  RETURN v_model_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN

  -- GUARDA 034: la identidad sale de la sesion, y ademas hay que ser
  -- participante de la conversacion. Antes bastaba con nombrar a cualquiera:
  -- se podian marcar como leidos los mensajes de una conversacion ajena.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
     WHERE c.id = p_conversation_id
       AND (c.participant_1 = p_user_id OR c.participant_2 = p_user_id)
  ) THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  -- Solo marcar mensajes que NO fueron enviados por el usuario actual
  UPDATE public.messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_1 uuid, p_user_2 uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_conversation_id UUID;
  v_ordered_1 UUID;
  v_ordered_2 UUID;
BEGIN

  -- GUARDA 034: quien llama tiene que ser uno de los dos participantes.
  IF auth.uid() IS NOT NULL
     AND auth.uid() NOT IN (p_user_1, p_user_2) THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  -- Validar que no sea el mismo usuario
  IF p_user_1 = p_user_2 THEN
    RAISE EXCEPTION 'No puedes crear una conversación contigo mismo';
  END IF;

  -- Ordenar IDs para consistencia (siempre el menor primero)
  IF p_user_1 < p_user_2 THEN
    v_ordered_1 := p_user_1;
    v_ordered_2 := p_user_2;
  ELSE
    v_ordered_1 := p_user_2;
    v_ordered_2 := p_user_1;
  END IF;

  -- Buscar conversación existente
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (participant_1 = v_ordered_1 AND participant_2 = v_ordered_2)
     OR (participant_1 = v_ordered_2 AND participant_2 = v_ordered_1);

  -- Si no existe, crear nueva
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1, participant_2)
    VALUES (v_ordered_1, v_ordered_2)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$function$;

-- ----------------------------------------------------------------------------
-- 3. Lectura: solo lo propio, salvo admin
--
--    Se añade pg_temp al search_path de las que solo declaraban 'public'.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_apply_mentor(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_points INTEGER;
  v_min_points INTEGER;
  v_plazas INTEGER;
  v_reapply_at TIMESTAMPTZ;
  v_cooldown_months INTEGER;
BEGIN

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  -- Obtener configuración
  SELECT (config_value)::INTEGER INTO v_min_points FROM public.mentor_config WHERE config_key = 'min_points_to_apply';
  SELECT (config_value)::INTEGER INTO v_cooldown_months FROM public.mentor_config WHERE config_key = 'cooldown_months';

  -- Obtener puntos del usuario
  v_points := public.get_mentor_points(p_user_id);

  -- Verificar si ya es mentor
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true) THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'Ya eres mentor activo', 'current_points', v_points, 'min_points', v_min_points);
  END IF;

  -- Verificar puntos mínimos
  IF v_points < v_min_points THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'No tienes suficientes puntos', 'current_points', v_points, 'min_points', v_min_points);
  END IF;

  -- Verificar cooldown (aplicación previa rechazada o expulsión)
  SELECT ma.can_reapply_at INTO v_reapply_at
  FROM public.mentor_applications ma
  WHERE ma.user_id = p_user_id AND ma.status IN ('rejected', 'withdrawn')
  ORDER BY ma.created_at DESC LIMIT 1;

  IF v_reapply_at IS NOT NULL AND v_reapply_at > NOW() THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'Debes esperar el período de cooldown', 'current_points', v_points, 'can_reapply_at', v_reapply_at);
  END IF;

  -- Verificar si tiene aplicación pendiente o en votación
  IF EXISTS (
    SELECT 1 FROM public.mentor_applications
    WHERE user_id = p_user_id AND status IN ('pending', 'voting')
  ) THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'Ya tienes una aplicación en proceso', 'current_points', v_points);
  END IF;

  -- Verificar plazas disponibles
  SELECT p.available_plazas INTO v_plazas FROM public.calculate_mentor_plazas() p;

  IF v_plazas <= 0 THEN
    RETURN jsonb_build_object('can_apply', false, 'reason', 'No hay plazas disponibles actualmente', 'current_points', v_points, 'available_plazas', 0);
  END IF;

  -- Puede aplicar
  RETURN jsonb_build_object('can_apply', true, 'reason', 'Puedes aplicar a mentor', 'current_points', v_points, 'min_points', v_min_points, 'available_plazas', v_plazas);
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_attempt_exam(p_user_id uuid, p_exam_id uuid)
 RETURNS TABLE(can_attempt boolean, reason text, next_available_at timestamp with time zone, models_used integer, total_models integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_last_attempt RECORD;
  v_exam RECORD;
  v_models_used INTEGER;
  v_total_models INTEGER;
  v_next_available TIMESTAMPTZ;
  v_path_status RECORD;
  v_quiz_status RECORD;
BEGIN

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.can_create_proposal(p_user_id uuid, p_level integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_xp INTEGER;
    v_role TEXT;
BEGIN

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

    -- Obtener XP y rol
    SELECT COALESCE(gs.total_xp, 0), u.role
    INTO v_xp, v_role
    FROM public.users u
    LEFT JOIN public.user_gamification_stats gs ON gs.user_id = u.id
    WHERE u.id = p_user_id;

    -- Nivel 1: Usuario con 50+ XP
    IF p_level = 1 THEN
        RETURN v_xp >= 50;
    END IF;

    -- Nivel 2: Solo mentor, admin o council
    IF p_level = 2 THEN
        RETURN v_role IN ('mentor', 'admin', 'council');
    END IF;

    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_validate_proposal(p_user_id uuid, p_proposal_level integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_role TEXT;
BEGIN

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id;

    -- Nivel 1: Mentores pueden validar
    IF p_proposal_level = 1 THEN
        RETURN v_role IN ('mentor', 'admin', 'council');
    END IF;

    -- Nivel 2: Solo council/admin
    IF p_proposal_level = 2 THEN
        RETURN v_role IN ('admin', 'council');
    END IF;

    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_best_quiz_attempt(p_user_id uuid, p_module_id uuid)
 RETURNS TABLE(id uuid, score integer, passed boolean, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT qa.id, qa.score, qa.passed, qa.completed_at
  FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.module_id = p_module_id
  ORDER BY qa.score DESC, qa.completed_at DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_exam_eligibility_details(p_user_id uuid, p_exam_id uuid)
 RETURNS TABLE(has_premium boolean, premium_status text, courses_required integer, courses_completed integer, courses_complete boolean, quizzes_required integer, quizzes_passed integer, quizzes_complete boolean, has_active_cert boolean, models_used integer, total_models integer, in_cooldown boolean, cooldown_ends_at timestamp with time zone, can_attempt boolean, reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.has_passed_module_quiz(p_user_id uuid, p_module_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_passed BOOLEAN;
BEGIN

  -- GUARDA 034: solo los datos propios, salvo que el llamante sea admin.
  -- auth.uid() NULL significa service_role y se deja pasar.
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.es_admin_actual() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT qa.passed INTO v_passed
  FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.module_id = p_module_id AND qa.passed = true
  ORDER BY qa.completed_at DESC
  LIMIT 1;

  RETURN COALESCE(v_passed, false);
END;
$function$;

-- ----------------------------------------------------------------------------
-- 4. generate_referral_code
--    Es SECURITY INVOKER y no recibe identidad, así que no necesita guarda: se
--    ejecuta con los privilegios de quien llama y RLS sigue aplicando. Lo que
--    le faltaba era search_path, y la 033 no se lo puso porque solo tocó las
--    SECURITY DEFINER. Con el search_path suelto, su
--    SELECT 1 FROM referral_links puede resolverse contra otra tabla y
--    devolver un código ya en uso.
-- ----------------------------------------------------------------------------

ALTER FUNCTION public.generate_referral_code(INTEGER)
  SET search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 5. track_referral_click: pasa a ser solo del servidor
--
--    No recibe identidad y hashea la IP, así que no filtra nada. El problema es
--    otro: la 033 le devolvió EXECUTE solo a authenticated, pero /r/[code] es
--    una ruta PÚBLICA y la mayoría de quienes siguen un enlace de referido no
--    han iniciado sesión. Desde la 033, esos clics fallan con 42501 y no se
--    registran. La ruta se cambia a createAdminClient en la misma rama.
--
--    La alternativa habría sido devolverle EXECUTE a anon, pero eso permite
--    inflar las estadísticas de clics de cualquier enlace desde fuera.
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.track_referral_click(
  CHARACTER VARYING, CHARACTER VARYING, TEXT, TEXT, TEXT, CHARACTER VARYING, CHARACTER VARYING)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_referral_click(
  CHARACTER VARYING, CHARACTER VARYING, TEXT, TEXT, TEXT, CHARACTER VARYING, CHARACTER VARYING)
  FROM anon;
REVOKE ALL ON FUNCTION public.track_referral_click(
  CHARACTER VARYING, CHARACTER VARYING, TEXT, TEXT, TEXT, CHARACTER VARYING, CHARACTER VARYING)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_referral_click(
  CHARACTER VARYING, CHARACTER VARYING, TEXT, TEXT, TEXT, CHARACTER VARYING, CHARACTER VARYING)
  TO service_role;

-- ----------------------------------------------------------------------------
-- 6. track_referral_conversion: cambia de firma
--
--    Recibía p_revenue_cents Y p_commission_rate, y calculaba
--    FLOOR(p_revenue_cents * p_commission_rate). Es decir: quien llamaba a la
--    RPC elegía cuánto se le pagaba. La tasa desaparece de los parámetros y se
--    lee de system_settings; el importe se queda, pero la función pasa a ser
--    exclusiva del servidor.
--
--    Cambiar la firma obliga a DROP + CREATE, y eso borra los privilegios, así
--    que hay que volver a concederlos. El DROP va con la firma completa y sin
--    CASCADE: si algo dependiera de ella, falla y no se escribe nada.
--
--    Si quieres fijar la tasa explícitamente (value es jsonb):
--      INSERT INTO public.system_settings (key, value, description)
--      VALUES ('referral_commission_rate', '0.30'::jsonb,
--              'Comision del instructor sobre ventas por referido, de 0 a 1')
--      ON CONFLICT (key) DO NOTHING;
--    Si la clave no existe, la función usa 0.30, que es exactamente lo que
--    venía haciendo el código. La migración no cambia lo que se paga.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.track_referral_conversion(
  UUID, UUID, UUID, CHARACTER VARYING, INTEGER, UUID, NUMERIC);

CREATE OR REPLACE FUNCTION public.track_referral_conversion(p_link_id uuid, p_user_id uuid, p_course_id uuid, p_conversion_type character varying, p_revenue_cents integer DEFAULT 0, p_click_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_link referral_links%ROWTYPE;
  v_commission_cents INTEGER;
  v_conversion_id UUID;
  v_commission_rate NUMERIC;
BEGIN

  -- GUARDA 034: solo el servidor. Esta funcion mueve dinero (comisiones de
  -- instructor) y ninguna sesion de usuario deberia poder invocarla. anon ya
  -- no puede desde la 033; authenticated pierde el EXECUTE mas abajo. Esto es
  -- el cinturon por si alguien se lo devuelve por descuido.
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Solo el servidor puede registrar conversiones'
      USING ERRCODE = '42501';
  END IF;

  -- La tasa de comision YA NO viene del llamante. Antes era un parametro,
  -- p_commission_rate, con DEFAULT 0.30, y la comision salia de multiplicarlo
  -- por p_revenue_cents: quien llamaba a la RPC elegia cuanto cobraba.
  --
  -- system_settings.value es jsonb, de ahi el #>> '{}' para sacarlo como texto.
  --
  -- OJO, DISCREPANCIA SIN RESOLVER: system_settings ya tiene una clave
  -- 'commission_rates' con instructor_referral_percent = 40, mientras que el
  -- codigo viene aplicando 0.30 en duro. Esta migracion NO cambia la tasa
  -- efectiva: sigue siendo 0.30 salvo que exista la clave
  -- 'referral_commission_rate'. Cambiarla es una decision de negocio, no algo
  -- que deba colarse en una migracion de seguridad.
  SELECT (value #>> '{}')::NUMERIC INTO v_commission_rate
    FROM public.system_settings
   WHERE key = 'referral_commission_rate';

  v_commission_rate := COALESCE(v_commission_rate, 0.30);

  IF v_commission_rate < 0 OR v_commission_rate > 1 THEN
    RAISE EXCEPTION 'Tasa de comision fuera de rango: %', v_commission_rate;
  END IF;

  -- Verificar que el enlace existe y está activo
  SELECT * INTO v_link
  FROM referral_links
  WHERE id = p_link_id;

  IF v_link.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'link_not_found'
    );
  END IF;

  -- Verificar que el curso corresponde (si el enlace es específico)
  IF v_link.course_id IS NOT NULL AND v_link.course_id != p_course_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'course_mismatch'
    );
  END IF;

  -- Calcular comisión
  v_commission_cents := FLOOR(p_revenue_cents * v_commission_rate);

  -- Insertar conversión (ignorar si ya existe)
  INSERT INTO referral_conversions (
    link_id, user_id, course_id, conversion_type,
    revenue_cents, instructor_commission_cents, commission_rate,
    click_id
  )
  VALUES (
    p_link_id, p_user_id, p_course_id, p_conversion_type,
    p_revenue_cents, v_commission_cents, v_commission_rate,
    p_click_id
  )
  ON CONFLICT (link_id, user_id, course_id) DO NOTHING
  RETURNING id INTO v_conversion_id;

  IF v_conversion_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'conversion_already_exists'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'conversion_id', v_conversion_id,
    'commission_cents', v_commission_cents
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.track_referral_conversion(
  UUID, UUID, UUID, CHARACTER VARYING, INTEGER, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_referral_conversion(
  UUID, UUID, UUID, CHARACTER VARYING, INTEGER, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.track_referral_conversion(
  UUID, UUID, UUID, CHARACTER VARYING, INTEGER, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_referral_conversion(
  UUID, UUID, UUID, CHARACTER VARYING, INTEGER, UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 7. calculate_gpower se queda ABIERTA a anon, a propósito
--
--    Es la única de las 17 que no lleva guarda, y es una decisión, no un olvido.
--    La vista proposals_with_details la usa y tiene security_invoker, de modo
--    que GET /api/governance/proposals —que no exige sesión— la ejecuta como
--    anon. Ponerle una guarda deja la gobernanza pública sin cargar.
--
--    Queda pendiente de tu decisión, con la recomendación en el mensaje que
--    acompaña a esta migración: lo correcto es que la vista lea el
--    gpower_used ya almacenado en governance_votes en lugar de recalcularlo, y
--    entonces sí se puede cerrar. Mientras tanto, cualquiera puede consultar el
--    poder de voto de cualquier usuario por su id.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 8. Red de seguridad
--    Si algo de lo anterior no dejó el estado esperado, se aborta y no se
--    escribe nada.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_mal TEXT := '';
BEGIN
  IF has_function_privilege('authenticated',
       'public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)',
       'EXECUTE') THEN
    v_mal := v_mal || 'track_referral_conversion sigue abierta a authenticated. ';
  END IF;

  IF NOT has_function_privilege('service_role',
       'public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)',
       'EXECUTE') THEN
    v_mal := v_mal || 'service_role no puede ejecutar track_referral_conversion. ';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.es_admin_actual()', 'EXECUTE') THEN
    v_mal := v_mal || 'authenticated no puede ejecutar es_admin_actual. ';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('vote_mentor_application','submit_mentor_application',
                         'mark_messages_as_read','get_or_create_conversation',
                         'select_exam_model','can_apply_mentor','can_attempt_exam',
                         'can_create_proposal','can_validate_proposal',
                         'get_best_quiz_attempt','get_exam_eligibility_details',
                         'has_passed_module_quiz','generate_referral_code')
       AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig,'{}')) AS c
                        WHERE c LIKE 'search\_path=%')
  ) THEN
    v_mal := v_mal || 'alguna funcion quedo sin search_path. ';
  END IF;

  IF v_mal <> '' THEN
    RAISE EXCEPTION 'Abortada: %', v_mal;
  END IF;
  RAISE NOTICE 'OK: guardas puestas y privilegios en su sitio';
END $$;

COMMIT;
