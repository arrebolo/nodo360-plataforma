-- ============================================================================
-- MIGRACION 107: el borrado de cuentas sin confirmar, sin un DELETE desnudo
--
-- EL FALLO, Y COMO SE ENCONTRO
-- La funcion borrar_cuentas_sin_confirmar() de la 105 fallaba SIEMPRE al llamarla
-- desde la aplicacion:
--
--     21000  DELETE requires a WHERE clause
--
-- Ese mensaje es de pg_safeupdate, que Supabase tiene activado para las
-- conexiones de PostgREST. Y en la funcion habia un DELETE sin WHERE: el que
-- vaciaba la tabla temporal de candidatos.
--
-- POR QUE LA AUTOPRUEBA DE LA 105 NO LO VIO, que es lo importante de este fichero
-- La autoprueba corre en el editor SQL, como `postgres`, y ahi pg_safeupdate NO
-- esta activado. La llamada de produccion llega por PostgREST como service_role,
-- donde SI lo esta. La prueba paso y la funcion estaba rota: el entorno de la
-- prueba no era el entorno del uso.
--
-- Lo encontro scripts/probar-borrado-sin-confirmar.mjs, que llama por rpc() igual
-- que la aplicacion. Es la razon de que ese script exista.
--
-- LA CORRECCION NO ES PONER UN WHERE
-- Se podria arreglar con `DELETE FROM candidatos WHERE true`, y seria esconder el
-- problema detras de una formula. La tabla temporal estaba ahi para que contar y
-- borrar no pudieran discrepar; eso se consigue mejor con una funcion que
-- devuelve los candidatos, que ademas se puede consultar por separado para
-- depurar. Sin tabla temporal no hay DELETE desnudo que arreglar.
--
-- LA 105 NO SE REESCRIBE: ya se aplico. Esto la sustituye con CREATE OR REPLACE.
--
-- NO BORRA NI UNA FILA al aplicarse. Es reejecutable. Y se prueba a si misma,
-- incluida una comprobacion de que no queda ningun DELETE ni UPDATE sin WHERE.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Los candidatos, en un solo sitio y consultables
-- =====================================================

CREATE OR REPLACE FUNCTION public.candidatas_sin_confirmar(p_dias integer DEFAULT 7)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
  SELECT a.id
    FROM auth.users a
    JOIN public.users u ON u.id = a.id
   WHERE a.email_confirmed_at IS NULL                              -- nunca confirmo
     AND a.created_at < now() - make_interval(days => p_dias)
     AND u.role = 'student';                                       -- y nadie le dio otro rol
$fn$;

COMMENT ON FUNCTION public.candidatas_sin_confirmar(integer) IS
  'Las cuentas que nunca confirmaron su direccion y llevan mas de p_dias registradas. La condicion vive AQUI y en ningun otro sitio: contar y borrar usan esta misma funcion, asi que no pueden discrepar. Sustituye a la tabla temporal de la 105, que obligaba a un DELETE sin WHERE y pg_safeupdate lo rechazaba en PostgREST.';

REVOKE ALL ON FUNCTION public.candidatas_sin_confirmar(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.candidatas_sin_confirmar(integer) TO service_role;

-- =====================================================
-- 2. El borrado, sin tabla temporal
-- =====================================================

CREATE OR REPLACE FUNCTION public.borrar_cuentas_sin_confirmar(
  p_dias        integer DEFAULT 7,
  p_solo_contar boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  v_n integer := 0;
BEGIN
  IF p_dias < 0 THEN
    RAISE EXCEPTION 'p_dias no puede ser negativo (llego %).', p_dias;
  END IF;

  SELECT count(*) INTO v_n FROM public.candidatas_sin_confirmar(p_dias);

  IF p_solo_contar OR v_n = 0 THEN
    RETURN v_n;
  END IF;

  -- Borrar de auth.users es lo que libera la direccion; public.users cae por la
  -- clave ajena. El WHERE es de verdad, no un adorno para contentar a
  -- pg_safeupdate: delimita exactamente las filas candidatas.
  DELETE FROM auth.users
   WHERE id IN (SELECT public.candidatas_sin_confirmar(p_dias));

  RAISE NOTICE 'borrar_cuentas_sin_confirmar: % cuenta(s) sin confirmar de mas de % dia(s).', v_n, p_dias;
  RETURN v_n;
END
$fn$;

COMMENT ON FUNCTION public.borrar_cuentas_sin_confirmar(integer, boolean) IS
  'Borra las cuentas que nunca confirmaron su direccion y llevan mas de p_dias registradas (7 por defecto). Devuelve cuantas. Con p_solo_contar = true no borra: dice cuantas habria. NUNCA toca una cuenta confirmada ni una cuyo rol no sea student. Los candidatos salen de candidatas_sin_confirmar(), asi que contar y borrar no pueden discrepar.';

REVOKE ALL ON FUNCTION public.borrar_cuentas_sin_confirmar(integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.borrar_cuentas_sin_confirmar(integer, boolean) TO service_role;

-- =====================================================
-- 3. La prueba
-- =====================================================

DO $prueba$
DECLARE
  v_cuerpo text;
  v_n      integer;
  v_c      integer;
BEGIN
  -- 1. NO QUEDA NINGUN DELETE NI UPDATE SIN WHERE.
  --
  -- Esta comprobacion existe porque pg_safeupdate es INVISIBLE desde el editor
  -- SQL: aqui un DELETE desnudo pasa sin queja, y por PostgREST revienta con
  -- 21000. Mirar el cuerpo de la funcion es la unica forma de cazarlo desde
  -- dentro de una migracion.
  FOR v_cuerpo IN
    SELECT p.prosrc
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('borrar_cuentas_sin_confirmar', 'candidatas_sin_confirmar')
  LOOP
    IF v_cuerpo ~* '(delete\s+from|update)\s+[a-z_."]+\s*;' THEN
      RAISE EXCEPTION 'PRUEBA 1 FALLIDA: queda un DELETE o UPDATE sin WHERE; pg_safeupdate lo rechazara por PostgREST.';
    END IF;
  END LOOP;
  RAISE NOTICE 'PRUEBA 1  ningun DELETE ni UPDATE sin WHERE en las funciones   PASA';

  -- 2. Ya no hay tabla temporal de por medio
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'borrar_cuentas_sin_confirmar'
       AND p.prosrc ILIKE '%CREATE TEMP TABLE%'
  ) THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: la funcion sigue creando una tabla temporal.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  sin tabla temporal                                   PASA';

  -- 3. Contar sigue coincidiendo con la condicion
  v_n := public.borrar_cuentas_sin_confirmar(7, true);
  SELECT count(*) INTO v_c FROM public.candidatas_sin_confirmar(7);
  IF v_n <> v_c THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: la funcion dice % y los candidatos son %.', v_n, v_c;
  END IF;
  RAISE NOTICE 'PRUEBA 3  contar coincide con candidatas_sin_confirmar (%)     PASA', v_n;

  -- 4. Con 0 dias NO entra ninguna cuenta confirmada
  v_n := public.borrar_cuentas_sin_confirmar(0, true);
  SELECT count(*) INTO v_c
    FROM auth.users a JOIN public.users u ON u.id = a.id
   WHERE a.email_confirmed_at IS NULL AND u.role = 'student';
  IF v_n <> v_c THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: con 0 dias dice % y deberia decir %.', v_n, v_c;
  END IF;
  RAISE NOTICE 'PRUEBA 4  con 0 dias sigue excluyendo a las confirmadas        PASA';

  -- 5. Y un p_dias negativo se rechaza
  BEGIN
    v_n := public.borrar_cuentas_sin_confirmar(-1, true);
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: acepto un numero de dias negativo.';
  EXCEPTION WHEN raise_exception THEN
    IF position('no puede ser negativo' in SQLERRM) = 0 THEN
      RAISE;
    END IF;
    RAISE NOTICE 'PRUEBA 5  un p_dias negativo se rechaza                       PASA';
  END;

  RAISE NOTICE 'Las cinco pruebas pasan. La prueba que de verdad importa es la de fuera:';
  RAISE NOTICE '    node scripts/probar-borrado-sin-confirmar.mjs';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'candidatas_sin_confirmar') AS funcion_candidatas,
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'borrar_cuentas_sin_confirmar') AS funcion_borrado,

  -- Lo que fallaba
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('borrar_cuentas_sin_confirmar', 'candidatas_sin_confirmar')
      AND p.prosrc ~* '(delete\s+from|update)\s+[a-z_."]+\s*;')                   AS delete_sin_where,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'borrar_cuentas_sin_confirmar'
      AND p.prosrc ILIKE '%CREATE TEMP TABLE%')                                   AS usa_tabla_temporal,

  public.borrar_cuentas_sin_confirmar(7, true)                                    AS borraria_hoy,
  (SELECT count(*) FROM public.candidatas_sin_confirmar(7))                        AS candidatas_hoy,
  (SELECT count(*) FROM public.users)                                             AS usuarios,
  (SELECT count(*) FROM public.users WHERE email_confirmed_at IS NULL)            AS sin_confirmar,

  -- ¿Quedo programado el cron? Aqui se ve, y desde fuera no.
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')                    AS pg_cron_instalado,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'cron' AND c.relname = 'job')                               AS tabla_cron_job,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'candidatas_sin_confirmar')
     AND (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
             AND p.proname IN ('borrar_cuentas_sin_confirmar', 'candidatas_sin_confirmar')
             AND p.prosrc ~* '(delete\s+from|update)\s+[a-z_."]+\s*;') = 0
     AND (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'borrar_cuentas_sin_confirmar'
             AND p.prosrc ILIKE '%CREATE TEMP TABLE%') = 0
     AND public.borrar_cuentas_sin_confirmar(7, true) = (SELECT count(*) FROM public.candidatas_sin_confirmar(7))
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;
