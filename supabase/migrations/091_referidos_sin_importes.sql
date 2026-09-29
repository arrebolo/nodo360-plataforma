-- ============================================================================
-- MIGRACION 091: los referidos siguen midiendo, pero dejan de anotar dinero
--
-- QUE HABIA
-- track_referral_conversion() leia una tasa de comision, la multiplicaba por el
-- importe que le pasaban y escribia el resultado en referral_conversions:
--
--     v_commission_cents := FLOOR(p_revenue_cents * v_commission_rate);
--
-- La tasa salia de system_settings.referral_commission_rate, y si esa clave no
-- existe —hoy no existe— caia en 0.30 por defecto. Ademas la columna
-- commission_rate tiene DEFAULT 0.3 a nivel de tabla.
--
-- POR QUE SE APAGA
-- No hay pasarela de pago, ni ventas, ni acuerdo de reparto con nadie. Anotar
-- un importe de comision es afirmar que alguien ha ganado algo. Mientras no
-- exista ese acuerdo por escrito, la cifra correcta es que no hay cifra.
--
-- QUE SE CONSERVA, Y ES LO IMPORTANTE
-- La atribucion entera. Se siguen registrando el enlace, la persona, el curso,
-- el tipo de conversion y el clic de origen. Lo unico que se pone a cero son
-- los tres campos de dinero. Los enlaces de referido siguen sirviendo para lo
-- que sirven de verdad hoy: saber que llega por cada uno.
--
-- LO QUE HAY ANOTADO A DIA DE HOY: NADA
-- Medido antes de escribir esto, tabla por tabla y con un select real, no con
-- head:true —que devuelve count null sin error para una tabla inexistente—:
--
--     referral_links            0 filas
--     referral_clicks           0 filas
--     referral_conversions      0 filas
--     revenue_transactions      0 filas
--     instructor_payouts        0 filas
--     course_purchases          0 filas
--     commission_transactions   NO EXISTE
--
-- O sea: no hay ni un importe que borrar. Esta migracion no borra nada; impide
-- que se escriba el primero.
--
-- LO QUE NO SE TOCA
-- system_settings tiene una clave 'commission_rates' con instructor 35/40 % y
-- mentor 45/50 %, de enero de 2026. No se borra: es una clave declarada en el
-- tipo de app/api/admin/settings y en lib/settings/getSetting, y quitarla es
-- una decision aparte. Queda inerte, porque la funcion ya no lee ninguna tasa.
--
-- UN INTENTO FALLIDO, ANOTADO
-- La primera version de la autoprueba genero un codigo de enlace de 21
-- caracteres, 'PRUEBA-091-' + epoch, y referral_links.code es character
-- varying(20). La migracion murio con 22001 (value too long) y, por estar todo
-- dentro de BEGIN/COMMIT, no se aplico NADA: comprobado despues en la base,
-- donde commission_rate seguia con DEFAULT 0.3 —y ese ALTER va ANTES del
-- bloque de prueba, asi que si hubiera commiteado valdria 0— y las dos tablas
-- seguian a cero filas, sin ninguna fila suelta.
--
-- Las columnas de texto que toca la prueba, medidas ahora una a una:
--     referral_links.code                 character varying(20)
--     referral_conversions.conversion_type character varying(20)
-- El codigo nuevo mide 15 y 'enrollment' mide 10. Y la prueba comprueba su
-- propia longitud contra information_schema antes de escribir, para que esto
-- no dependa de que alguien se acuerde.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La funcion, sin aritmetica de dinero
-- =====================================================
-- La FIRMA no cambia, a proposito: app/api/enroll/route.ts la llama con
-- p_revenue_cents y con la lista completa de parametros. Cambiar la firma
-- obligaria a desplegar el codigo y la base a la vez.
--
-- p_revenue_cents se sigue aceptando y se IGNORA. Queda documentado aqui para
-- que nadie lo busque creyendo que se guarda en algun sitio.

CREATE OR REPLACE FUNCTION public.track_referral_conversion(
  p_link_id uuid,
  p_user_id uuid,
  p_course_id uuid,
  p_conversion_type character varying,
  p_revenue_cents integer DEFAULT 0,
  p_click_id uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_link referral_links%ROWTYPE;
  v_conversion_id UUID;
BEGIN
  -- GUARDA DE LA 034, intacta: solo el servidor. Ninguna sesion de usuario
  -- debe poder fabricarse una conversion.
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Solo el servidor puede registrar conversiones'
      USING ERRCODE = '42501';
  END IF;

  -- Aqui iba una lectura de la tasa en system_settings y una multiplicacion
  -- por el importe recibido. Se va entera: no hay ventas ni acuerdo de
  -- reparto, asi que no hay importe que calcular.
  --
  -- (Los nombres exactos de aquello no se escriben en este cuerpo a proposito:
  --  la verificacion final comprueba que NO aparecen en pg_get_functiondef,
  --  y un comentario que los citara haria fallar su propia comprobacion.)

  SELECT * INTO v_link
  FROM referral_links
  WHERE id = p_link_id;

  IF v_link.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'link_not_found');
  END IF;

  -- Si el enlace es de un curso concreto, tiene que coincidir
  IF v_link.course_id IS NOT NULL AND v_link.course_id != p_course_id THEN
    RETURN json_build_object('success', false, 'error', 'course_mismatch');
  END IF;

  -- La atribucion se guarda entera. El dinero, a cero y explicito: dejar que
  -- actuaran los DEFAULT de la tabla escribiria commission_rate = 0.3.
  INSERT INTO referral_conversions (
    link_id, user_id, course_id, conversion_type,
    revenue_cents, instructor_commission_cents, commission_rate,
    click_id
  )
  VALUES (
    p_link_id, p_user_id, p_course_id, p_conversion_type,
    0, 0, 0,
    p_click_id
  )
  ON CONFLICT (link_id, user_id, course_id) DO NOTHING
  RETURNING id INTO v_conversion_id;

  IF v_conversion_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'conversion_already_exists');
  END IF;

  -- commission_cents se sigue devolviendo, siempre 0, porque quien llama lo
  -- escribe en su log. Devolver la clave evita un undefined por ahi.
  RETURN json_build_object(
    'success', true,
    'conversion_id', v_conversion_id,
    'commission_cents', 0
  );
END;
$function$;

COMMENT ON FUNCTION public.track_referral_conversion(uuid, uuid, uuid, character varying, integer, uuid) IS
  'Registra la atribucion de una inscripcion a un enlace de referido. Desde la 091 NO anota importes: revenue_cents, instructor_commission_cents y commission_rate se escriben a 0. No hay pasarela de pago ni acuerdo de reparto, y anotar una comision es afirmar que alguien ha ganado algo. p_revenue_cents se acepta por compatibilidad de firma y se ignora.';

-- Los privilegios de la 034 se mantienen. Se repiten porque CREATE OR REPLACE
-- sobre una funcion existente los conserva, pero si algun dia esta migracion
-- corre sobre una base donde la funcion no existiera, naceria abierta.
REVOKE ALL ON FUNCTION public.track_referral_conversion(uuid, uuid, uuid, character varying, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_referral_conversion(uuid, uuid, uuid, character varying, integer, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.track_referral_conversion(uuid, uuid, uuid, character varying, integer, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_referral_conversion(uuid, uuid, uuid, character varying, integer, uuid) TO service_role;

-- =====================================================
-- 2. Segunda cerradura: los DEFAULT de la tabla
-- =====================================================
-- commission_rate tenia DEFAULT 0.3. Si algun dia alguien inserta en
-- referral_conversions sin pasar por la funcion, que no herede una tasa.

ALTER TABLE public.referral_conversions ALTER COLUMN commission_rate SET DEFAULT 0;
ALTER TABLE public.referral_conversions ALTER COLUMN revenue_cents SET DEFAULT 0;
ALTER TABLE public.referral_conversions ALTER COLUMN instructor_commission_cents SET DEFAULT 0;

COMMENT ON COLUMN public.referral_conversions.instructor_commission_cents IS
  'Siempre 0 desde la 091. No hay pasarela de pago ni acuerdo de reparto: no se anotan importes de comision.';

-- =====================================================
-- 3. La prueba, dentro de la propia migracion
-- =====================================================
-- Se crea un enlace de usar y tirar, se llama a la funcion con un importe
-- grande a proposito, y se comprueba que lo que queda escrito son ceros. Todo
-- se borra en la misma transaccion. Si algo no cuadra, la migracion se deshace.

DO $prueba$
DECLARE
  v_usuario uuid;
  v_curso   uuid;
  v_link    uuid;
  v_res     json;
  v_conv    referral_conversions%ROWTYPE;
  -- referral_links.code es character varying(20). El primer intento uso
  -- 'PRUEBA-091-' + epoch = 21 caracteres y la migracion entera murio con
  -- 22001 (value too long). Con 'P091-' son 15. La comprobacion de abajo esta
  -- para que un cambio futuro no vuelva a pasarse sin enterarse.
  v_codigo  text := 'P091-' || extract(epoch from clock_timestamp())::bigint;
  v_max     integer;
BEGIN
  SELECT character_maximum_length INTO v_max
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'referral_links' AND column_name = 'code';

  IF v_max IS NOT NULL AND length(v_codigo) > v_max THEN
    RAISE EXCEPTION
      'El codigo de prueba mide % caracteres y referral_links.code admite %.',
      length(v_codigo), v_max;
  END IF;

  SELECT id INTO v_usuario FROM public.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_curso   FROM public.courses ORDER BY created_at LIMIT 1;

  IF v_usuario IS NULL OR v_curso IS NULL THEN
    RAISE NOTICE 'PRUEBA OMITIDA: hacen falta al menos un usuario y un curso.';
    RETURN;
  END IF;

  INSERT INTO public.referral_links (instructor_id, code)
  VALUES (v_usuario, v_codigo)
  RETURNING id INTO v_link;

  -- 12345 centimos: si quedara rastro de aritmetica, se veria
  v_res := public.track_referral_conversion(v_link, v_usuario, v_curso, 'enrollment', 12345, NULL);

  IF (v_res ->> 'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'PRUEBA FALLIDA: la funcion no registro la conversion (%).', v_res ->> 'error';
  END IF;

  SELECT * INTO v_conv FROM public.referral_conversions WHERE id = (v_res ->> 'conversion_id')::uuid;

  IF v_conv.link_id IS DISTINCT FROM v_link OR v_conv.user_id IS DISTINCT FROM v_usuario THEN
    RAISE EXCEPTION 'PRUEBA FALLIDA: la atribucion no se guardo. Eso es lo que NO se queria perder.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  la atribucion se guarda (enlace, persona, curso)   PASA';

  IF v_conv.revenue_cents <> 0 OR v_conv.instructor_commission_cents <> 0 OR v_conv.commission_rate <> 0 THEN
    RAISE EXCEPTION
      'PRUEBA FALLIDA: se anoto dinero. revenue=%, comision=%, tasa=%',
      v_conv.revenue_cents, v_conv.instructor_commission_cents, v_conv.commission_rate;
  END IF;
  RAISE NOTICE 'PRUEBA 2  los tres campos de dinero quedan a cero            PASA';

  IF (v_res ->> 'commission_cents')::integer <> 0 THEN
    RAISE EXCEPTION 'PRUEBA FALLIDA: la funcion devuelve una comision distinta de cero.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  la funcion devuelve commission_cents = 0           PASA';

  DELETE FROM public.referral_conversions WHERE id = v_conv.id;
  DELETE FROM public.referral_links WHERE id = v_link;
  RAISE NOTICE 'Filas de prueba borradas. Las tres pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  to_regprocedure('public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)') IS NOT NULL
                                                                        AS funcion_existe,

  -- Que la aritmetica ya no esta dentro, no solo que la funcion exista
  pg_get_functiondef('public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)'::regprocedure)
    NOT LIKE '%p_revenue_cents * %'                                      AS sin_multiplicacion,
  pg_get_functiondef('public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)'::regprocedure)
    NOT LIKE '%referral_commission_rate%'                                AS sin_lectura_de_tasa,

  (SELECT column_default FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referral_conversions'
      AND column_name = 'commission_rate')                               AS defecto_de_la_tasa,

  has_function_privilege('authenticated',
    'public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)', 'EXECUTE')
                                                                         AS auth_puede_llamarla,
  has_function_privilege('service_role',
    'public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)', 'EXECUTE')
                                                                         AS servicio_puede_llamarla,

  (SELECT count(*) FROM public.referral_conversions)                      AS conversiones,
  (SELECT count(*) FROM public.referral_conversions
    WHERE instructor_commission_cents <> 0 OR revenue_cents <> 0)         AS conversiones_con_importe,
  (SELECT count(*) FROM public.referral_links)                            AS enlaces,
  (SELECT count(*) FROM public.referral_links WHERE code LIKE 'P091-%') AS enlaces_de_prueba_que_quedan,

  CASE
    WHEN to_regprocedure('public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)') IS NOT NULL
     AND pg_get_functiondef('public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)'::regprocedure)
           NOT LIKE '%p_revenue_cents * %'
     AND pg_get_functiondef('public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)'::regprocedure)
           NOT LIKE '%referral_commission_rate%'
     AND NOT has_function_privilege('authenticated',
           'public.track_referral_conversion(uuid,uuid,uuid,character varying,integer,uuid)', 'EXECUTE')
     AND (SELECT count(*) FROM public.referral_conversions
           WHERE instructor_commission_cents <> 0 OR revenue_cents <> 0) = 0
     AND (SELECT count(*) FROM public.referral_links WHERE code LIKE 'P091-%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                     AS veredicto;
