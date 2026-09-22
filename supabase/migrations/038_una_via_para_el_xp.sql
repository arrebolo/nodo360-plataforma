-- ============================================================================
-- 038 APLICAR — una sola vía concede el XP de una lección
--
-- LO QUE REVELÓ 037-leer.sql
--
-- 1. El trigger de los 10 XP existe y está vivo: trigger_award_xp_lesson sobre
--    user_progress -> award_xp_on_lesson_complete. La versión viva NO es la de
--    supabase/migrations/004: rellena metadata->>'lesson_id' en lugar de
--    related_id, escribe en la columna xp_amount y además suma 10 XP
--    directamente a user_gamification_stats.
--    Resultado: cada lección concedía 60 XP, 50 por awardXP() y 10 por aquí.
--
-- 2. update_user_stats_on_xp, el trigger sobre xp_events, NO incrementa:
--    recalcula total_xp = SUM(xp_earned). Es la autoridad real, y por eso los
--    totales cuadraban con la suma pese a los dos caminos. Solo se dispara
--    AFTER INSERT, así que borrar eventos no actualiza nada.
--
-- 3. reset_course_progress borra xp_events con
--       WHERE lesson_id = ANY(v_lesson_ids)
--    pero lesson_id está a NULL en las 588 filas: no borra nada. Después llama
--    a recalculate_user_stats.
--
-- 4. recalculate_user_stats calcula lecciones * 10 e ignora quizzes, badges,
--    puntuaciones perfectas y ajustes de admin. Llamarla destruye el total.
--
-- 5. certificates ya tiene TRES índices únicos sobre (user_id, course_id):
--    certificates_user_course_unique, unique_user_course_certificate y
--    certificates_unique_course_user. El que añadía la 037 sobraba: se retira
--    aquí. Un segundo certificado ya era imposible.
--
-- ORDEN: aplicar esto ANTES de la limpieza (038-limpieza.sql).
-- Primero se cierra el grifo; después se limpia lo acumulado.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Una sola vía para el XP de una lección
--
--    Se desconecta el trigger, no se borra la función: si hubiera que volver
--    atrás, basta con recrear el trigger. Y queda el rastro de qué hacía.
--
--    A partir de aquí el XP de lección lo concede solo awardXP(), que desde la
--    037 guarda related_id y hace ON CONFLICT DO NOTHING contra el índice
--    único. Es decir: una vez por lección y usuario, pase lo que pase.
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trigger_award_xp_lesson ON public.user_progress;

COMMENT ON FUNCTION public.award_xp_on_lesson_complete() IS
  'DESCONECTADA en la migracion 038. Concedia 10 XP por leccion en paralelo a awardXP(), que ya concede 50: cada leccion sumaba 60. Se conserva el cuerpo por si hubiera que revisar el historico. NO volver a engancharla sin quitar antes la concesion del codigo.';

-- ----------------------------------------------------------------------------
-- 2. Borrar eventos también recalcula
--
--    update_user_stats_on_xp solo se disparaba AFTER INSERT, así que borrar un
--    xp_event dejaba el total intacto y mentiroso. Al cubrir DELETE, la
--    limpieza y reset_course_progress se corrigen solos.
--
--    En un DELETE, NEW es nulo: hay que mirar OLD. El cuerpo es el mismo que
--    ya había, con esa única diferencia.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_user_stats_on_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
  new_total_xp INTEGER;
  new_level INTEGER;
  xp_for_next INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT COALESCE(SUM(xp_earned), 0)
    INTO new_total_xp
    FROM xp_events
   WHERE user_id = v_user_id;

  new_level := FLOOR(new_total_xp / 100) + 1;
  xp_for_next := (new_level * 100) - new_total_xp;

  UPDATE user_gamification_stats
     SET total_xp = new_total_xp,
         current_level = new_level,
         xp_to_next_level = xp_for_next,
         updated_at = NOW()
   WHERE user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_user_stats_on_xp ON public.xp_events;
CREATE TRIGGER trigger_update_user_stats_on_xp
  AFTER INSERT OR UPDATE OR DELETE ON public.xp_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_on_xp();

-- ----------------------------------------------------------------------------
-- 3. recalculate_user_stats deja de inventarse el total
--
--    Pasa a sumar xp_events, que es la misma cuenta que hace el trigger de
--    arriba. Antes calculaba lecciones * 10, así que llamarla borraba el XP de
--    quizzes, badges, puntuaciones perfectas y ajustes de admin.
--
--    Se mantiene la firma y el JSON de respuesta para no romper a quien la
--    llame. lessons_completed se sigue devolviendo, pero ya no decide el XP.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_user_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_completed_lessons INT;
    v_new_xp INT;
    v_new_level INT;
    v_xp_to_next INT;
BEGIN
    SELECT COUNT(*) INTO v_completed_lessons
      FROM user_progress
     WHERE user_id = p_user_id AND is_completed = true;

    -- xp_events es la unica fuente de verdad del XP.
    SELECT COALESCE(SUM(xp_earned), 0) INTO v_new_xp
      FROM xp_events
     WHERE user_id = p_user_id;

    v_new_xp := GREATEST(0, v_new_xp);
    v_new_level := FLOOR(v_new_xp / 100) + 1;
    v_xp_to_next := (v_new_level * 100) - v_new_xp;

    UPDATE user_gamification_stats
       SET total_xp = v_new_xp,
           current_level = v_new_level,
           xp_to_next_level = v_xp_to_next,
           updated_at = NOW()
     WHERE user_id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'lessons_completed', v_completed_lessons,
        'total_xp', v_new_xp,
        'level', v_new_level,
        'xp_to_next', v_xp_to_next
    );
END;
$function$;

-- ----------------------------------------------------------------------------
-- 4. reset_course_progress: el XP ganado NO se devuelve ni se vuelve a conceder
--
--    Decisión: reiniciar un curso pone el progreso a cero para poder repasarlo,
--    pero el XP ya ganado se queda. Completarlo otra vez no suma, porque el
--    índice único de la 037 lo impide.
--
--    El DELETE de xp_events se retira: filtraba por lesson_id, que está a NULL
--    en toda la tabla, así que nunca borró nada. Dejarlo "arreglado" para que
--    sí borrara sería el comportamiento contrario al pedido.
--
--    El resto del cuerpo queda igual.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reset_course_progress(
    p_user_id UUID, p_course_id UUID, p_delete_certificate BOOLEAN DEFAULT false)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_lesson_ids UUID[];
    v_deleted_progress INT := 0;
    v_deleted_certificate INT := 0;
    v_stats JSON;
BEGIN
    SELECT ARRAY_AGG(l.id) INTO v_lesson_ids
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = p_course_id;

    IF v_lesson_ids IS NULL OR array_length(v_lesson_ids, 1) IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No se encontraron lecciones');
    END IF;

    SELECT COUNT(*) INTO v_deleted_progress
      FROM user_progress
     WHERE user_id = p_user_id
       AND lesson_id = ANY(v_lesson_ids)
       AND is_completed = true;

    DELETE FROM user_progress
     WHERE user_id = p_user_id
       AND lesson_id = ANY(v_lesson_ids);

    -- El XP ganado se conserva a proposito. Ver la cabecera del bloque 4.

    IF p_delete_certificate THEN
        DELETE FROM certificates
         WHERE user_id = p_user_id AND course_id = p_course_id;
        GET DIAGNOSTICS v_deleted_certificate = ROW_COUNT;
    END IF;

    UPDATE course_enrollments
       SET progress_percentage = 0,
           completed_at = NULL,
           last_accessed_at = NOW()
     WHERE user_id = p_user_id AND course_id = p_course_id;

    SELECT recalculate_user_stats(p_user_id) INTO v_stats;

    RETURN json_build_object(
        'success', true,
        'deleted_progress', v_deleted_progress,
        'deleted_certificate', v_deleted_certificate,
        'xp_conservado', true,
        'new_stats', v_stats
    );
END;
$function$;

-- ----------------------------------------------------------------------------
-- 5. Se retira el índice redundante de la 037
--
--    certificates ya tenía tres índices únicos sobre lo mismo antes de que yo
--    añadiera un cuarto. Un segundo certificado por curso ya era imposible.
-- ----------------------------------------------------------------------------

DROP INDEX IF EXISTS public.certificates_uno_por_curso;

-- ----------------------------------------------------------------------------
-- 6. Red de seguridad
-- ----------------------------------------------------------------------------

DO $$
DECLARE v_mal TEXT := '';
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
              WHERE c.relname = 'user_progress' AND t.tgname = 'trigger_award_xp_lesson') THEN
    v_mal := v_mal || 'el trigger de los 10 XP sigue enganchado. ';
  END IF;
  IF to_regclass('public.xp_events_fuente_unica') IS NULL THEN
    v_mal := v_mal || 'falta el indice unico de la 037: aplicarla primero. ';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'recalculate_user_stats'
                AND p.prosrc ~ 'v_completed_lessons \* 10') THEN
    v_mal := v_mal || 'recalculate_user_stats sigue calculando lecciones * 10. ';
  END IF;
  IF v_mal <> '' THEN
    RAISE EXCEPTION 'Abortada: %', v_mal;
  END IF;
  RAISE NOTICE 'OK: una sola via concede el XP de leccion';
END $$;

COMMIT;
