-- ============================================================================
-- MIGRACION 102: la fecha en que se envio el correo de bienvenida
--
-- POR QUE HACE FALTA UNA COLUMNA
-- Hoy el correo de bienvenida se envia en el momento del registro, antes de que
-- la persona confirme su direccion. Pasa a enviarse cuando la confirma, y eso
-- abre la puerta a enviarlo dos veces: el enlace de confirmacion se puede pulsar
-- otra vez, y en el registro con Google no hay confirmacion ninguna, asi que la
-- señal es «su primer acceso», que tampoco es un momento unico.
--
-- La unica forma de que se envie UNA vez es que la base lo recuerde. Con la
-- fecha, ademas, se puede responder «¿cuando se le envio?», que es mas util que
-- un booleano.
--
-- EL RELLENO DE LAS FILAS QUE YA EXISTEN, Y POR QUE NO ES OPCIONAL
-- Las 26 cuentas actuales ya recibieron su correo al registrarse, con el
-- comportamiento viejo. Si se quedaran a NULL, la primera vez que cada una
-- vuelva a entrar recibiria un SEGUNDO correo de bienvenida. Eso es correo no
-- solicitado enviado por un despliegue, asi que el relleno va en la misma
-- migracion que la columna, no despues.
--
-- Se rellena con created_at, no con now(): es la fecha en la que el
-- comportamiento viejo lo envio. No es exacta al segundo, y por eso queda dicho
-- en el COMMENT de la columna.
--
-- VENTANA CONOCIDA: entre aplicar esta migracion y desplegar el codigo nuevo,
-- una cuenta creada en ese hueco recibe el correo del registro (codigo viejo) y
-- se queda a NULL, asi que recibiria otro al confirmar. Se cierra aplicando la
-- migracion junto al despliegue. No se puede cerrar desde SQL.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La columna
-- =====================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

COMMENT ON COLUMN public.users.welcome_email_sent_at IS
  'Cuando se envio el correo de bienvenida, o NULL si no se ha enviado. Es el cerrojo que hace que se envie UNA vez: se reclama con un UPDATE condicionado a IS NULL, y solo se envia si ese UPDATE devuelve fila. Las cuentas anteriores al 30/09/2026 la tienen rellenada con created_at, que es cuando el comportamiento viejo lo enviaba: esas fechas son aproximadas. Solo la escribe service_role.';

-- =====================================================
-- 2. El relleno, para que nadie reciba un segundo correo
-- =====================================================

UPDATE public.users
   SET welcome_email_sent_at = created_at
 WHERE welcome_email_sent_at IS NULL;

-- =====================================================
-- 3. Que no la lea ni la escriba quien no debe
-- =====================================================
-- Desde la 049 `users` no tiene privilegio de tabla para anon ni authenticated,
-- solo GRANT por columna. Una columna nueva nace, por tanto, cerrada para los
-- dos: no hay que revocar nada. Se comprueba mas abajo en vez de suponerlo,
-- porque un GRANT de tabla haria inerte esa suposicion —la leccion de la 084—.

-- =====================================================
-- 4. La prueba: el cerrojo funciona
-- =====================================================

DO $prueba$
DECLARE
  v_id    uuid;
  v_antes timestamptz;
  v_n     integer;
BEGIN
  SELECT id, welcome_email_sent_at INTO v_id, v_antes
    FROM public.users ORDER BY created_at LIMIT 1;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos un usuario.';
  END IF;

  -- 1. Todas las filas quedan con fecha: nadie recibira un segundo correo
  SELECT count(*) INTO v_n FROM public.users WHERE welcome_email_sent_at IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: % fila(s) sin fecha; esas recibirian otro correo.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 1  ninguna cuenta existente recibira un segundo correo   PASA';

  -- Se vacia una para probar el cerrojo, y se deja como estaba al final.
  UPDATE public.users SET welcome_email_sent_at = NULL WHERE id = v_id;

  -- 2. La primera reclamacion se la lleva
  WITH reclamada AS (
    UPDATE public.users
       SET welcome_email_sent_at = now()
     WHERE id = v_id AND welcome_email_sent_at IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO v_n FROM reclamada;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: la primera reclamacion devolvio % filas, esperaba 1.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 2  la primera reclamacion se lleva la fila               PASA';

  -- 3. La segunda no: es lo que impide el segundo envio
  WITH reclamada AS (
    UPDATE public.users
       SET welcome_email_sent_at = now()
     WHERE id = v_id AND welcome_email_sent_at IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO v_n FROM reclamada;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: la segunda reclamacion devolvio % filas, esperaba 0.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 3  la segunda reclamacion no devuelve nada               PASA';

  -- 4. Y se deja exactamente como estaba
  UPDATE public.users SET welcome_email_sent_at = v_antes WHERE id = v_id;
  IF (SELECT welcome_email_sent_at FROM public.users WHERE id = v_id) IS DISTINCT FROM v_antes THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: no se restauro el valor original.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  la fila de prueba queda como estaba                   PASA';

  RAISE NOTICE 'Las cuatro pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'
             AND column_name = 'welcome_email_sent_at')                          AS columna_creada,

  (SELECT count(*) FROM public.users WHERE welcome_email_sent_at IS NULL)        AS sin_fecha_recibirian_otro,
  (SELECT count(*) FROM public.users)                                           AS usuarios,

  -- Cerrada para quien no debe tocarla
  has_column_privilege('anon',          'public.users', 'welcome_email_sent_at', 'SELECT') AS anon_la_lee,
  has_column_privilege('authenticated', 'public.users', 'welcome_email_sent_at', 'SELECT') AS auth_la_lee,
  has_column_privilege('authenticated', 'public.users', 'welcome_email_sent_at', 'UPDATE') AS auth_la_escribe,

  -- Lo de siempre, que no se haya movido
  has_column_privilege('anon', 'public.users', 'email', 'SELECT')                AS anon_lee_email,
  (SELECT count(*) FROM public.users WHERE role = 'admin')                       AS admins,

  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'users'
                    AND column_name = 'welcome_email_sent_at')
     AND (SELECT count(*) FROM public.users WHERE welcome_email_sent_at IS NULL) = 0
     AND NOT has_column_privilege('anon',          'public.users', 'welcome_email_sent_at', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'welcome_email_sent_at', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'welcome_email_sent_at', 'UPDATE')
     AND NOT has_column_privilege('anon', 'public.users', 'email', 'SELECT')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
