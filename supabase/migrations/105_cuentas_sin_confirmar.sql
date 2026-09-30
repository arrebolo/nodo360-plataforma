-- ============================================================================
-- MIGRACION 105: una cuenta sin confirmar no es un usuario
--
-- LO MEDIDO PRIMERO
-- La fila de public.users nace AL REGISTRARSE, no al confirmar. Comprobado
-- creando una cuenta con email_confirm:false: la fila ya estaba, con rol
-- 'student', y count(*) la incluia. Hay un trigger sobre auth.users que la crea,
-- y ese trigger NO esta versionado en supabase/migrations: no aparece en ninguna.
--
-- POR ESO ESTA MIGRACION NO LO TOCA. Reescribir una funcion cuya definicion no
-- tengo delante es escribir a ciegas sobre el camino por el que entra todo el
-- mundo. Se añaden triggers propios que no dependen de el ni de su nombre.
--
-- LA DECISION: MARCAR Y EXCLUIR, NO RETRASAR LA FILA
-- La otra opcion era crear la fila al confirmar. Se descarta, y no por comodidad:
-- «toda cuenta de auth tiene fila en public.users» es una invariante de la que
-- cuelga mi_perfil(), el callback de autenticacion y las claves ajenas que
-- apuntan a users.id. Romperla para arreglar un recuento es cambiar un cimiento
-- por una tarjeta del panel.
--
-- Marcar cuesta una columna y no rompe nada: email_confirmed_at vive en
-- auth.users, que PostgREST no expone, asi que el panel no puede filtrar por
-- ella. Reflejada en public.users, filtrar es trivial.
--
-- TRES TRIGGERS, Y NINGUNO DEPENDE DEL ORDEN DE OTRO
--   1. BEFORE INSERT en public.users: rellena la columna mirando auth.users.
--      Asi funciona quien sea el que cree la fila, y da igual si el otro trigger
--      se llama antes o despues: esto corre DENTRO de su INSERT.
--   2. AFTER UPDATE OF email_confirmed_at en auth.users: el momento de confirmar.
--   3. (ninguno mas: no hace falta)
--
-- EL BORRADO A LOS 7 DIAS
-- Funcion borrar_cuentas_sin_confirmar(dias, solo_contar). Borra de auth.users,
-- que es lo que libera el correo; public.users cae por la clave ajena.
--
-- NUNCA TOCA: una cuenta con el correo confirmado, ni una cuenta cuyo rol no sea
-- 'student'. Lo segundo no lo pedia el enunciado —pedia «ni admins»— pero un
-- instructor o un mentor sin confirmar tampoco se borra solo: si alguien le
-- cambio el rol, es que alguien sabe que existe.
--
-- Se programa con pg_cron si el proyecto lo permite. La migracion lo INTENTA y
-- dice si lo consiguio; no aborta si no puede, porque la funcion sirve igual
-- llamada desde fuera.
--
-- NO BORRA NI UNA FILA al aplicarse. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La columna, reflejo de auth.users
-- =====================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;

COMMENT ON COLUMN public.users.email_confirmed_at IS
  'Reflejo de auth.users.email_confirmed_at. NULL = la persona nunca confirmo su direccion. Existe porque auth.users no esta expuesta por PostgREST y sin esto el panel no puede distinguir un registro real de un intento. La mantienen los triggers de la 105; no se escribe a mano.';

-- =====================================================
-- 2. Que se rellene sola, venga la fila de donde venga
-- =====================================================

CREATE OR REPLACE FUNCTION public.reflejar_confirmacion_al_crear()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
BEGIN
  -- Mira auth.users en el mismo INSERT que crea la fila. No depende de que otro
  -- trigger haya corrido antes ni de como se llame.
  SELECT a.email_confirmed_at INTO NEW.email_confirmed_at
    FROM auth.users a
   WHERE a.id = NEW.id;
  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.reflejar_confirmacion_al_crear() IS
  'Rellena users.email_confirmed_at al crear la fila, leyendo auth.users. Es BEFORE INSERT sobre public.users a proposito: asi corre dentro del INSERT de quien sea que cree la fila, y no hay que conocer ni tocar el trigger de auth.users que la crea, que no esta versionado en el repositorio.';

REVOKE ALL ON FUNCTION public.reflejar_confirmacion_al_crear() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_reflejar_confirmacion_al_crear ON public.users;
CREATE TRIGGER trg_reflejar_confirmacion_al_crear
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.reflejar_confirmacion_al_crear();

-- El momento de confirmar
CREATE OR REPLACE FUNCTION public.reflejar_confirmacion_del_correo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
BEGIN
  UPDATE public.users
     SET email_confirmed_at = NEW.email_confirmed_at
   WHERE id = NEW.id
     AND email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at;
  RETURN NULL;
END
$fn$;

COMMENT ON FUNCTION public.reflejar_confirmacion_del_correo() IS
  'Copia email_confirmed_at de auth.users a public.users cuando alguien confirma. El trigger de la cuenta admin (100) no lo bloquea: esa columna no esta entre las que protege.';

REVOKE ALL ON FUNCTION public.reflejar_confirmacion_del_correo() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_reflejar_confirmacion_del_correo ON auth.users;
CREATE TRIGGER trg_reflejar_confirmacion_del_correo
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.reflejar_confirmacion_del_correo();

-- =====================================================
-- 3. Y que las 24 filas de hoy queden al dia
-- =====================================================

UPDATE public.users u
   SET email_confirmed_at = a.email_confirmed_at
  FROM auth.users a
 WHERE a.id = u.id
   AND u.email_confirmed_at IS DISTINCT FROM a.email_confirmed_at;

-- =====================================================
-- 4. El borrado de las que nunca se confirmaron
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

  -- Los candidatos, en un solo sitio para que contar y borrar no puedan
  -- discrepar: si la condicion viviera dos veces, el «solo contar» mentiria.
  CREATE TEMP TABLE IF NOT EXISTS candidatos_sin_confirmar (id uuid PRIMARY KEY)
    ON COMMIT DROP;
  DELETE FROM candidatos_sin_confirmar;

  INSERT INTO candidatos_sin_confirmar (id)
  SELECT a.id
    FROM auth.users a
    JOIN public.users u ON u.id = a.id
   WHERE a.email_confirmed_at IS NULL           -- nunca confirmo
     AND a.created_at < now() - make_interval(days => p_dias)
     AND u.role = 'student';                    -- y nadie le ha dado otro rol

  SELECT count(*) INTO v_n FROM candidatos_sin_confirmar;

  IF p_solo_contar OR v_n = 0 THEN
    RETURN v_n;
  END IF;

  -- Borrar de auth.users es lo que libera el correo. public.users cae por la
  -- clave ajena, y el trigger de la 100 pararia cualquier fila admin que se
  -- hubiera colado aqui, que es una red de seguridad mas.
  DELETE FROM auth.users WHERE id IN (SELECT id FROM candidatos_sin_confirmar);

  RAISE NOTICE 'borrar_cuentas_sin_confirmar: % cuenta(s) sin confirmar de mas de % dia(s).', v_n, p_dias;
  RETURN v_n;
END
$fn$;

COMMENT ON FUNCTION public.borrar_cuentas_sin_confirmar(integer, boolean) IS
  'Borra las cuentas que nunca confirmaron su direccion y llevan mas de p_dias registradas (7 por defecto). Devuelve cuantas. Con p_solo_contar = true no borra nada: dice cuantas habria. NUNCA toca una cuenta con el correo confirmado ni una cuyo rol no sea student. Borra de auth.users, que es lo que libera la direccion.';

REVOKE ALL ON FUNCTION public.borrar_cuentas_sin_confirmar(integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.borrar_cuentas_sin_confirmar(integer, boolean) TO service_role;

-- =====================================================
-- 5. Programarlo, si este proyecto puede
-- =====================================================

DO $cron$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron NO disponible (%). La funcion queda creada; hay que llamarla desde fuera.', SQLERRM;
    RETURN;
  END;

  BEGIN
    PERFORM cron.unschedule('borrar-cuentas-sin-confirmar');
  EXCEPTION WHEN OTHERS THEN
    NULL;  -- no estaba programada
  END;

  BEGIN
    PERFORM cron.schedule(
      'borrar-cuentas-sin-confirmar',
      '30 4 * * *',                       -- todos los dias a las 04:30 UTC
      $$SELECT public.borrar_cuentas_sin_confirmar(7);$$
    );
    RAISE NOTICE 'pg_cron: programado «borrar-cuentas-sin-confirmar» a las 04:30 UTC.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron esta pero no se pudo programar (%). Hay que llamarla desde fuera.', SQLERRM;
  END;
END
$cron$;

-- =====================================================
-- 6. La prueba
-- =====================================================

DO $prueba$
DECLARE
  v_alguien   uuid;
  v_conf      timestamptz;
  v_reflejo   timestamptz;
  v_n         integer;
  v_desfase   integer;
BEGIN
  -- 1. La columna refleja a auth.users en TODAS las filas
  SELECT count(*) INTO v_desfase
    FROM public.users u
    JOIN auth.users a ON a.id = u.id
   WHERE u.email_confirmed_at IS DISTINCT FROM a.email_confirmed_at;
  IF v_desfase <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: % fila(s) no coinciden con auth.users.', v_desfase;
  END IF;
  RAISE NOTICE 'PRUEBA 1  las % filas reflejan auth.users exactamente         PASA',
    (SELECT count(*) FROM public.users);

  -- 2. EL REFLEJO FUNCIONA DE VERDAD, sin cambiar ningun dato.
  --
  -- Se toca una cuenta YA confirmada escribiendo en auth.users el mismo valor
  -- que ya tiene. `AFTER UPDATE OF` salta por estar la columna en el SET, no por
  -- que cambie, asi que el trigger corre de verdad y no se altera nada.
  SELECT a.id, a.email_confirmed_at INTO v_alguien, v_conf
    FROM auth.users a WHERE a.email_confirmed_at IS NOT NULL LIMIT 1;
  IF v_alguien IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos una cuenta confirmada.';
  END IF;

  UPDATE public.users SET email_confirmed_at = NULL WHERE id = v_alguien;
  UPDATE auth.users SET email_confirmed_at = v_conf WHERE id = v_alguien;

  SELECT email_confirmed_at INTO v_reflejo FROM public.users WHERE id = v_alguien;
  IF v_reflejo IS DISTINCT FROM v_conf THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el trigger de auth.users no reflejo la confirmacion (quedo %).', coalesce(v_reflejo::text, 'NULL');
  END IF;
  RAISE NOTICE 'PRUEBA 2  al confirmar en auth.users, se refleja aqui         PASA';

  -- 3. Hoy no hay ninguna cuenta sin confirmar, asi que el borrado no borraria nada
  v_n := public.borrar_cuentas_sin_confirmar(7, true);
  SELECT count(*) INTO v_desfase FROM auth.users WHERE email_confirmed_at IS NULL;
  IF v_n <> (SELECT count(*) FROM auth.users a JOIN public.users u ON u.id = a.id
              WHERE a.email_confirmed_at IS NULL
                AND a.created_at < now() - make_interval(days => 7)
                AND u.role = 'student') THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: el recuento de la funcion no coincide con su propia condicion.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  solo_contar coincide con la condicion (% candidatas, % sin confirmar en total)  PASA', v_n, v_desfase;

  -- 4. Con 0 dias, una cuenta CONFIRMADA sigue sin ser candidata.
  --
  -- Es la prueba que importa: p_dias = 0 hace elegible a cualquiera por edad, asi
  -- que si la condicion de confirmacion estuviera mal, aqui saldrian las 24.
  v_n := public.borrar_cuentas_sin_confirmar(0, true);
  IF v_n <> (SELECT count(*) FROM auth.users a JOIN public.users u ON u.id = a.id
              WHERE a.email_confirmed_at IS NULL AND u.role = 'student') THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: con 0 dias la funcion incluye cuentas que no debe (dijo %).', v_n;
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE email_confirmed_at IS NOT NULL) AND v_n >= (SELECT count(*) FROM auth.users) THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: con 0 dias la funcion se llevaria cuentas confirmadas.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  con 0 dias NO entra ninguna cuenta confirmada       PASA';

  -- 5. Y un dia negativo se rechaza en vez de hacer algo raro
  BEGIN
    v_n := public.borrar_cuentas_sin_confirmar(-1, true);
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: acepto un numero de dias negativo.';
  EXCEPTION WHEN raise_exception THEN
    IF position('no puede ser negativo' in SQLERRM) = 0 THEN
      RAISE;
    END IF;
    RAISE NOTICE 'PRUEBA 5  un p_dias negativo se rechaza                      PASA';
  END;

  RAISE NOTICE 'Las cinco pruebas pasan. Ninguna fila alterada.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'
             AND column_name = 'email_confirmed_at')                            AS columna_creada,

  -- El reflejo, exacto
  (SELECT count(*) FROM public.users u JOIN auth.users a ON a.id = u.id
    WHERE u.email_confirmed_at IS DISTINCT FROM a.email_confirmed_at)           AS filas_desfasadas,

  (SELECT count(*) FROM public.users)                                           AS usuarios,
  (SELECT count(*) FROM public.users WHERE email_confirmed_at IS NOT NULL)      AS confirmados,
  (SELECT count(*) FROM public.users WHERE email_confirmed_at IS NULL)          AS sin_confirmar,

  -- Los triggers
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reflejar_confirmacion_al_crear'
            AND tgrelid = 'public.users'::regclass)                             AS trigger_al_crear,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reflejar_confirmacion_del_correo'
            AND tgrelid = 'auth.users'::regclass)                               AS trigger_al_confirmar,

  -- El borrado
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'borrar_cuentas_sin_confirmar') AS funcion_de_borrado,
  public.borrar_cuentas_sin_confirmar(7, true)                                  AS borraria_hoy,

  -- ¿Quedo programado?
  EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')                  AS pg_cron_instalado,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'cron' AND c.relname = 'job')                             AS tabla_cron_job,

  -- Nada movido
  (SELECT count(*) FROM public.users WHERE role = 'admin')                       AS admins,
  has_column_privilege('anon',          'public.users', 'email_confirmed_at', 'SELECT') AS anon_lee_columna,
  has_column_privilege('authenticated', 'public.users', 'email_confirmed_at', 'SELECT') AS auth_lee_columna,

  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'users'
                    AND column_name = 'email_confirmed_at')
     AND (SELECT count(*) FROM public.users u JOIN auth.users a ON a.id = u.id
           WHERE u.email_confirmed_at IS DISTINCT FROM a.email_confirmed_at) = 0
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reflejar_confirmacion_al_crear'
                   AND tgrelid = 'public.users'::regclass)
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reflejar_confirmacion_del_correo'
                   AND tgrelid = 'auth.users'::regclass)
     AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'borrar_cuentas_sin_confirmar')
     AND NOT has_column_privilege('anon',          'public.users', 'email_confirmed_at', 'SELECT')
     AND NOT has_column_privilege('authenticated', 'public.users', 'email_confirmed_at', 'SELECT')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                           AS veredicto;
