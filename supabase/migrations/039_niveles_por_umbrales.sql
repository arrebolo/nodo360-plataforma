-- ============================================================================
-- 039 APLICAR — los umbrales con nombre son la única fórmula de nivel
--
-- DECISIÓN
-- El nivel se calcula con los diez umbrales con nombre, de Novato a Satoshi.
-- Se retiran las otras dos fórmulas que convivían:
--   lineal      floor(xp/100)+1           en update_user_stats_on_xp
--   progresiva  calculate_level_from_xp   ya sin trigger que la llame
--
-- UNA CORRECCIÓN AL DIAGNÓSTICO ANTERIOR
-- Dije que calculateLevel() de TypeScript usaba la fórmula lineal. No es así:
-- el PR #36 (21/01/2026) la cambió a lineal, pero el #43, del día siguiente,
-- la devolvió a los umbrales. Lo comprobé sobre el archivo de hoy, no sobre el
-- diff. Es decir: TypeScript lleva bien desde enero y la fórmula lineal vivía
-- SOLO en la base de datos. Por eso el nivel guardado no cuadraba con nada.
--
-- Y yo empeoré el reparto: en la 038 alineé recalculate_user_stats con la
-- lineal "para que coincidiera con el trigger", sin mirar qué usaba la
-- interfaz. Esta migración lo deshace.
--
-- DESPLEGAR EL CÓDIGO ANTES
-- La rama fix/niveles-umbrales quita calculateLevel y hace que UserLevel.tsx
-- saque el número, el nombre y la barra del mismo sitio.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Los umbrales, en un solo sitio dentro de la base de datos
--
--    Tabla y no system_settings: así se puede consultar con SQL corriente,
--    unirla a otras consultas y verla en el editor. level_rules se queda para
--    lo suyo y deja de usarse para el nivel.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.level_thresholds (
  level    INTEGER PRIMARY KEY,
  name     TEXT    NOT NULL,
  min_xp   INTEGER NOT NULL UNIQUE CHECK (min_xp >= 0)
);

COMMENT ON TABLE public.level_thresholds IS
  'Unica fuente de verdad del nivel. level_from_xp() la usa, y LEVEL_THRESHOLDS de lib/gamification/levels.ts debe coincidir: 039-comprobar.sql lo verifica.';

INSERT INTO public.level_thresholds (level, name, min_xp) VALUES
  (1,  'Novato',      0),
  (2,  'Aprendiz',    500),
  (3,  'Estudiante',  1500),
  (4,  'Conocedor',   3500),
  (5,  'Experto',     7000),
  (6,  'Maestro',     12000),
  (7,  'Veterano',    25000),
  (8,  'Leyenda',     45000),
  (9,  'Sabio',       75000),
  (10, 'Satoshi',     120000)
ON CONFLICT (level) DO UPDATE
  SET name = EXCLUDED.name, min_xp = EXCLUDED.min_xp;

ALTER TABLE public.level_thresholds ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.level_thresholds FROM anon;
REVOKE ALL ON public.level_thresholds FROM authenticated;
GRANT SELECT ON public.level_thresholds TO anon;
GRANT SELECT ON public.level_thresholds TO authenticated;
GRANT ALL    ON public.level_thresholds TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'level_thresholds'
                    AND policyname = 'level_thresholds_lectura_publica') THEN
    -- Son los nombres de los niveles: informacion publica del producto.
    CREATE POLICY level_thresholds_lectura_publica ON public.level_thresholds
      FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Las funciones que los usan
--    Nacen con search_path y sin EXECUTE para PUBLIC, que es la regla desde
--    la 033.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.level_from_xp(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT t.level FROM public.level_thresholds t
      WHERE t.min_xp <= GREATEST(0, COALESCE(p_xp, 0))
      ORDER BY t.min_xp DESC LIMIT 1),
    1);
$$;

CREATE OR REPLACE FUNCTION public.xp_to_next_level_from_xp(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- 0 en el nivel maximo: no hay siguiente umbral.
  SELECT COALESCE(
    (SELECT MIN(t.min_xp) - GREATEST(0, COALESCE(p_xp, 0))
       FROM public.level_thresholds t
      WHERE t.min_xp > GREATEST(0, COALESCE(p_xp, 0))),
    0);
$$;

REVOKE ALL ON FUNCTION public.level_from_xp(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.level_from_xp(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.level_from_xp(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.level_from_xp(INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.xp_to_next_level_from_xp(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.xp_to_next_level_from_xp(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.xp_to_next_level_from_xp(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_to_next_level_from_xp(INTEGER) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. El trigger de xp_events deja la fórmula lineal
--    Mismo cuerpo que dejó la 038 (cubre INSERT, UPDATE y DELETE), cambiando
--    solo cómo calcula el nivel.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_user_stats_on_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id UUID;
  new_total_xp INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  SELECT COALESCE(SUM(xp_earned), 0) INTO new_total_xp
    FROM xp_events
   WHERE user_id = v_user_id;

  UPDATE user_gamification_stats
     SET total_xp         = new_total_xp,
         current_level    = public.level_from_xp(new_total_xp),
         xp_to_next_level = public.xp_to_next_level_from_xp(new_total_xp),
         updated_at       = NOW()
   WHERE user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ----------------------------------------------------------------------------
-- 4. recalculate_user_stats, igual
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_user_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

    SELECT GREATEST(0, COALESCE(SUM(xp_earned), 0)) INTO v_new_xp
      FROM xp_events
     WHERE user_id = p_user_id;

    v_new_level  := public.level_from_xp(v_new_xp);
    v_xp_to_next := public.xp_to_next_level_from_xp(v_new_xp);

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
-- 5. Recalcular a todo el mundo
-- ----------------------------------------------------------------------------

UPDATE public.user_gamification_stats s
   SET current_level    = public.level_from_xp(COALESCE(s.total_xp, 0)),
       xp_to_next_level = public.xp_to_next_level_from_xp(COALESCE(s.total_xp, 0)),
       updated_at       = NOW()
 WHERE s.current_level    IS DISTINCT FROM public.level_from_xp(COALESCE(s.total_xp, 0))
    OR s.xp_to_next_level IS DISTINCT FROM public.xp_to_next_level_from_xp(COALESCE(s.total_xp, 0));

-- ----------------------------------------------------------------------------
-- 6. Las dos funciones viejas
--
--    Se borran solo si NADIE las invoca ya. Si alguna función las sigue
--    llamando, se quedan y se marcan como obsoletas: borrarlas rompería esa
--    función. El aviso dice cuál es.
--
--    award_xp_on_lesson_complete las llama, pero la 038 la dejó sin trigger.
--    Aun así cuenta como referencia: si aparece, se marcan y no se borran.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_refs TEXT;
BEGIN
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_refs
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
   WHERE p.proname NOT IN ('calculate_level_from_xp', 'calculate_xp_to_next_level')
     AND (p.prosrc ~ '\mcalculate_level_from_xp\M'
       OR p.prosrc ~ '\mcalculate_xp_to_next_level\M');

  IF v_refs IS NULL THEN
    DROP FUNCTION IF EXISTS public.calculate_level_from_xp(INTEGER);
    DROP FUNCTION IF EXISTS public.calculate_xp_to_next_level(INTEGER, INTEGER);
    DROP FUNCTION IF EXISTS public.calculate_xp_to_next_level(INTEGER);
    RAISE NOTICE '6. Nadie las usaba: calculate_level_from_xp y calculate_xp_to_next_level borradas';
  ELSE
    EXECUTE $c$COMMENT ON FUNCTION public.calculate_level_from_xp(INTEGER) IS
      'OBSOLETA desde la 039. La formula oficial son los umbrales: public.level_from_xp(). No usar.'$c$;
    RAISE NOTICE '6. NO se borran: las siguen invocando %. Marcadas como obsoletas.', v_refs;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Red de seguridad
-- ----------------------------------------------------------------------------

DO $$
DECLARE v_mal TEXT := '';
BEGIN
  IF (SELECT count(*) FROM public.level_thresholds) <> 10 THEN
    v_mal := v_mal || 'level_thresholds no tiene 10 filas. ';
  END IF;
  IF public.level_from_xp(0) <> 1 OR public.level_from_xp(499) <> 1
     OR public.level_from_xp(500) <> 2 OR public.level_from_xp(120000) <> 10
     OR public.level_from_xp(999999) <> 10 THEN
    v_mal := v_mal || 'level_from_xp no devuelve lo esperado en los bordes. ';
  END IF;
  IF public.xp_to_next_level_from_xp(0) <> 500
     OR public.xp_to_next_level_from_xp(120000) <> 0 THEN
    v_mal := v_mal || 'xp_to_next_level_from_xp no cuadra. ';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_gamification_stats s
              WHERE s.current_level IS DISTINCT FROM public.level_from_xp(COALESCE(s.total_xp,0))) THEN
    v_mal := v_mal || 'algun usuario quedo con el nivel sin recalcular. ';
  END IF;
  IF v_mal <> '' THEN
    RAISE EXCEPTION 'Abortada: %', v_mal;
  END IF;
  RAISE NOTICE 'OK: los umbrales son la unica formula de nivel';
END $$;

COMMIT;
