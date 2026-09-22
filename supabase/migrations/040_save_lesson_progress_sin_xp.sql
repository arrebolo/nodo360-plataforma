-- ============================================================================
-- 040 APLICAR — save_lesson_progress deja de tocar el XP y el nivel
--
-- LO QUE HACÍA (cuerpo real, leído con pg_get_functiondef)
--   1. Sumaba 10 XP directamente a user_gamification_stats.
--   2. Calculaba el nivel con FLOOR(v_new_xp / 100) + 1, la fórmula lineal que
--      la 039 retiró de todos los demás sitios.
--   3. Insertaba en xp_events usando la columna lesson_id, no related_id, así
--      que ESQUIVABA el índice único de la 037: podía duplicar puntos sin que
--      nada lo impidiera.
--   4. Ese INSERT iba envuelto en BEGIN ... EXCEPTION WHEN OTHERS THEN NULL,
--      que se traga cualquier error en silencio. Por eso nadie lo vio.
--
-- Era la tercera vía de XP por lección, después de awardXP() y del trigger que
-- desconectó la 038.
--
-- ESTÁ INACTIVA, PERO ES UNA MINA
-- No la llama ninguna línea del código, y desde la 033 ni anon ni
-- authenticated tienen EXECUTE: solo service_role. Comprobado con la clave
-- anon, que recibe 42501. Aun así, cualquiera que la llamase desde el servidor
-- volvería a descuadrar current_level.
--
-- QUÉ PASA A HACER
-- Solo lo que dice su nombre: guardar el progreso. No concede XP, no escribe
-- stats y no calcula ningún nivel. El XP de una lección lo concede awardXP()
-- desde /api/progress, que registra la fuente y es idempotente, y el nivel lo
-- escribe únicamente update_user_stats_on_xp.
--
-- CAMBIA EL CONTRATO: xpGained pasa a ser siempre 0. Se puede hacer porque no
-- la llama nadie; si algún día se usa, el XP va por la API.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. save_lesson_progress: solo progreso
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.save_lesson_progress(p_user_id UUID, p_lesson_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_ya_completada BOOLEAN := false;
    v_stats RECORD;
BEGIN
    SELECT is_completed INTO v_ya_completada
      FROM user_progress
     WHERE user_id = p_user_id AND lesson_id = p_lesson_id;

    INSERT INTO user_progress (user_id, lesson_id, is_completed, completed_at)
    VALUES (p_user_id, p_lesson_id, true, NOW())
    ON CONFLICT (user_id, lesson_id) DO UPDATE
      SET is_completed = true,
          -- No se pisa la fecha original: completar algo ya completado no
          -- deberia cambiar cuando se hizo.
          completed_at = COALESCE(user_progress.completed_at, NOW());

    -- Que exista la fila de stats, sin tocar sus valores.
    INSERT INTO user_gamification_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Se devuelve lo que hay, no lo que esta funcion calcule. El nivel lo
    -- escribe update_user_stats_on_xp y nadie mas.
    SELECT total_xp, current_level, xp_to_next_level INTO v_stats
      FROM user_gamification_stats
     WHERE user_id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'alreadyCompleted', COALESCE(v_ya_completada, false),
        -- Siempre 0: esta funcion ya no concede XP. Lo hace awardXP().
        'xpGained', 0,
        'totalXp', COALESCE(v_stats.total_xp, 0),
        'level', COALESCE(v_stats.current_level, 1),
        'xpToNextLevel', COALESCE(v_stats.xp_to_next_level, 0)
    );
END;
$function$;

COMMENT ON FUNCTION public.save_lesson_progress(UUID, UUID) IS
  'Guarda el progreso de una leccion. NO concede XP ni escribe el nivel: eso lo hacen awardXP() y update_user_stats_on_xp. Hasta la 040 sumaba 10 XP por su cuenta, calculaba el nivel con la formula lineal e insertaba en xp_events usando lesson_id en lugar de related_id, esquivando el indice unico de la 037.';

-- ----------------------------------------------------------------------------
-- 2. calculate_xp_to_next_level
--
--    La 039 tenía que marcar las dos funciones viejas como obsoletas y solo
--    marcó calculate_level_from_xp: el COMMENT de la otra se quedó fuera. Es
--    un olvido mío. Aquí se corrige, y de paso se borran las dos si ya no las
--    referencia nadie.
--
--    Se comprueba cada una por separado: puede que una siga referenciada y la
--    otra no.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_refs_nivel TEXT;
  v_refs_xp TEXT;
  r RECORD;
BEGIN
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_refs_nivel
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname <> 'calculate_level_from_xp'
     AND p.prosrc ~ '\mcalculate_level_from_xp\M';

  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_refs_xp
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname <> 'calculate_xp_to_next_level'
     AND p.prosrc ~ '\mcalculate_xp_to_next_level\M';

  IF v_refs_nivel IS NULL THEN
    DROP FUNCTION IF EXISTS public.calculate_level_from_xp(INTEGER);
    RAISE NOTICE '2. calculate_level_from_xp borrada: no la referencia nadie';
  ELSE
    EXECUTE format('COMMENT ON FUNCTION public.calculate_level_from_xp(INTEGER) IS %L',
      'OBSOLETA desde la 039. La formula oficial son los umbrales: public.level_from_xp(). La siguen referenciando: ' || v_refs_nivel);
    RAISE NOTICE '2. calculate_level_from_xp marcada obsoleta. La referencian: %', v_refs_nivel;
  END IF;

  -- Puede tener varias firmas: se recorren todas.
  IF v_refs_xp IS NULL THEN
    FOR r IN
      SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'calculate_xp_to_next_level'
    LOOP
      EXECUTE format('DROP FUNCTION IF EXISTS %s', r.sig);
    END LOOP;
    RAISE NOTICE '2. calculate_xp_to_next_level borrada: no la referencia nadie';
  ELSE
    FOR r IN
      SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'calculate_xp_to_next_level'
    LOOP
      EXECUTE format('COMMENT ON FUNCTION %s IS %L', r.sig,
        'OBSOLETA desde la 039. Usar public.xp_to_next_level_from_xp(). La referencian: ' || v_refs_xp);
    END LOOP;
    RAISE NOTICE '2. calculate_xp_to_next_level marcada obsoleta. La referencian: %', v_refs_xp;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Red de seguridad
-- ----------------------------------------------------------------------------

DO $$
DECLARE v_mal TEXT := '';
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'save_lesson_progress'
                AND p.prosrc ~ 'FLOOR\s*\(\s*\w+\s*/\s*100\s*\)') THEN
    v_mal := v_mal || 'save_lesson_progress sigue con la formula lineal. ';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'save_lesson_progress'
                AND p.prosrc ~ '\mxp_events\M') THEN
    v_mal := v_mal || 'save_lesson_progress sigue escribiendo en xp_events. ';
  END IF;

  -- Ninguna funcion de public debe calcular ya el nivel con la lineal.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public'
                AND p.prosrc ~ 'FLOOR\s*\(\s*\w+\s*/\s*100\s*\)\s*\+\s*1') THEN
    v_mal := v_mal || 'queda alguna funcion con floor(xp/100)+1. ';
  END IF;

  IF v_mal <> '' THEN
    RAISE EXCEPTION 'Abortada: %', v_mal;
  END IF;
  RAISE NOTICE 'OK: solo update_user_stats_on_xp escribe el nivel';
END $$;

COMMIT;
