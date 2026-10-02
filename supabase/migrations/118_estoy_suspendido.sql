-- 118. ¿Estoy suspendido?
--
-- POR QUE
--   El middleware leía `users.is_suspended` con la sesión de la propia persona, y esa
--   columna está cerrada a `authenticated`: la consulta entera moría con 42501, la fila
--   llegaba vacía, `undefined` se leía como «no suspendida» y LA PUERTA NO SE CERRABA
--   NUNCA. Medido con una cuenta suspendida de prueba: entraba en /dashboard con 200.
--
--   El parche inmediato fue leerla con el cliente de servicio. Esto es lo que tenía que
--   ser: una función que contesta por la sesión que la llama, sin abrir la columna a
--   nadie y sin meter la clave de servicio en el middleware.
--
-- LO QUE NO HACE
--   No decide la excepción de los admins. Devuelve el hecho —esta cuenta está
--   suspendida o no— y quien pregunta aplica su política; el rol sí es legible por cada
--   persona, así que esa parte no necesita ayuda. Una función que mezclara las dos cosas
--   diría «no suspendido» de un admin suspendido, que es una respuesta falsa.
--
-- IDENTIDAD DESDE auth.uid(), nunca por parámetro: PostgREST es alcanzable
-- directamente y la clave anónima es pública (misma regla que la 034).

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ¿Está suspendida la cuenta de quien llama?
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.estoy_suspendido()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT u.is_suspended FROM public.users u WHERE u.id = auth.uid()),
    FALSE
  );
$$;

COMMENT ON FUNCTION public.estoy_suspendido() IS
  'TRUE si la cuenta de quien llama está suspendida. Sin sesión, FALSE. No aplica la '
  'excepción de los admins: eso lo decide quien pregunta.';

REVOKE ALL ON FUNCTION public.estoy_suspendido() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.estoy_suspendido() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Y el motivo, para poder decírselo
--
-- Aparte, y no en la misma función, porque el motivo solo hace falta cuando la
-- respuesta es sí: así el caso normal —que es «no»— no mueve texto de nadie.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.motivo_de_mi_suspension()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.suspended_reason
    FROM public.users u
   WHERE u.id = auth.uid()
     AND COALESCE(u.is_suspended, FALSE);
$$;

COMMENT ON FUNCTION public.motivo_de_mi_suspension() IS
  'El motivo de la suspensión de quien llama, o NULL si no está suspendida.';

REVOKE ALL ON FUNCTION public.motivo_de_mi_suspension() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.motivo_de_mi_suspension() TO authenticated;

COMMIT;

-- ═════════════════════════════════════════════════════════════════════════════
-- AUTOPRUEBA
--
-- NO ESCRIBE NADA. Dos razones, y las dos son de seguridad, no de comodidad:
--
--   1. No puede crear una cuenta de usar y tirar: `public.users.id` tiene clave ajena a
--      `auth.users` (`users_id_fkey`, medido), así que una fila inventada no entra.
--
--   2. Y no va a cambiarle la bandera a una cuenta de verdad para luego devolverla. Un
--      ROLLBACK aquí tampoco vale: si el editor de SQL envuelve el script entero en una
--      transacción, ese ROLLBACK se llevaría por delante las funciones recién creadas.
--      Y si la restauración fallara, dejaría a alguien suspendido de verdad.
--
-- Así que aquí se comprueba lo que se puede comprobar sin tocar nada: que la función
-- contesta lo que dice la tabla para una cuenta real, que sin sesión contesta FALSE y no
-- NULL, y los permisos. EL CASO «SI, SUSPENDIDA» se comprueba de punta a punta en
-- scripts/probar-el-middleware.mts, que crea su propia cuenta por la API de
-- administración, la suspende y la borra al terminar.
-- ═════════════════════════════════════════════════════════════════════════════
DO $autoprueba$
DECLARE
  v_id          UUID;
  v_en_la_tabla BOOLEAN;
  v_funcion     BOOLEAN;
  v_motivo      TEXT;
  v_fallos      INT := 0;
  v_grant_auth  BOOLEAN;
  v_grant_anon  BOOLEAN;
BEGIN
  SELECT u.id, COALESCE(u.is_suspended, FALSE)
    INTO v_id, v_en_la_tabla
    FROM public.users u
   ORDER BY u.created_at
   LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'REVISAR: no hay ninguna cuenta con la que probar';
  END IF;

  -- Haciéndose pasar por ella: `request.jwt.claims` es lo que lee auth.uid().
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_id)::TEXT, TRUE);

  SELECT public.estoy_suspendido() INTO v_funcion;
  IF v_funcion IS DISTINCT FROM v_en_la_tabla THEN
    RAISE WARNING 'FALLA: la función dice % y la tabla dice %',
      COALESCE(v_funcion::TEXT, 'NULL'), v_en_la_tabla;
    v_fallos := v_fallos + 1;
  END IF;

  IF v_funcion IS NULL THEN
    RAISE WARNING 'FALLA: la función devuelve NULL, que se leería como «no se sabe»';
    v_fallos := v_fallos + 1;
  END IF;

  -- El motivo solo existe si está suspendida.
  SELECT public.motivo_de_mi_suspension() INTO v_motivo;
  IF NOT v_en_la_tabla AND v_motivo IS NOT NULL THEN
    RAISE WARNING 'FALLA: sin suspensión hay motivo: %', v_motivo;
    v_fallos := v_fallos + 1;
  END IF;

  -- Sin sesión: FALSE, no NULL. Con `{}` hay claims pero no hay «sub», que es el caso
  -- de una petición sin autenticar.
  PERFORM set_config('request.jwt.claims', '{}', TRUE);
  SELECT public.estoy_suspendido() INTO v_funcion;
  IF v_funcion IS DISTINCT FROM FALSE THEN
    RAISE WARNING 'FALLA: sin sesión contesta % en vez de FALSE', COALESCE(v_funcion::TEXT, 'NULL');
    v_fallos := v_fallos + 1;
  END IF;

  SELECT public.motivo_de_mi_suspension() INTO v_motivo;
  IF v_motivo IS NOT NULL THEN
    RAISE WARNING 'FALLA: sin sesión hay motivo: %', v_motivo;
    v_fallos := v_fallos + 1;
  END IF;

  -- Los permisos: que `anon` no pueda preguntar por nadie.
  SELECT has_function_privilege('authenticated', 'public.estoy_suspendido()', 'EXECUTE'),
         has_function_privilege('anon', 'public.estoy_suspendido()', 'EXECUTE')
    INTO v_grant_auth, v_grant_anon;

  IF NOT v_grant_auth THEN
    RAISE WARNING 'FALLA: authenticated no puede ejecutar estoy_suspendido()';
    v_fallos := v_fallos + 1;
  END IF;
  IF v_grant_anon THEN
    RAISE WARNING 'FALLA: anon puede ejecutar estoy_suspendido()';
    v_fallos := v_fallos + 1;
  END IF;

  IF v_fallos = 0 THEN
    RAISE NOTICE 'TODO CORRECTO: 7 comprobaciones, y sin escribir nada';
  ELSE
    RAISE EXCEPTION 'REVISAR: % comprobaciones falladas', v_fallos;
  END IF;
END
$autoprueba$;

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACION, una fila
-- ═════════════════════════════════════════════════════════════════════════════
SELECT
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'estoy_suspendido')             AS estoy_suspendido,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'motivo_de_mi_suspension')      AS motivo,
  has_function_privilege('authenticated', 'public.estoy_suspendido()', 'EXECUTE') AS la_puede_usar_authenticated,
  has_function_privilege('anon', 'public.estoy_suspendido()', 'EXECUTE')          AS la_puede_usar_anon,
  (SELECT COUNT(*) FROM public.users WHERE COALESCE(suspended_reason, '') = 'Motivo de la autoprueba')
                                                                               AS restos_de_la_autoprueba,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname IN ('estoy_suspendido', 'motivo_de_mi_suspension')) = 2
     AND has_function_privilege('authenticated', 'public.estoy_suspendido()', 'EXECUTE')
     AND NOT has_function_privilege('anon', 'public.estoy_suspendido()', 'EXECUTE')
     AND (SELECT COUNT(*) FROM public.users WHERE COALESCE(suspended_reason, '') = 'Motivo de la autoprueba') = 0
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;
