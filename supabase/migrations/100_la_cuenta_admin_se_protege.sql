-- ============================================================================
-- MIGRACION 100: una cuenta admin no se toca sin decirlo a proposito
--
-- POR QUE
-- Hay UNA sola cuenta con rol admin. Si alguien le cambia el rol o la suspende
-- —desde el panel, desde una ruta de API, desde una aprobacion de verificacion,
-- desde PostgREST con la clave de servicio o desde un script— no queda nadie
-- que pueda deshacerlo desde la aplicacion. Un unico clic mal dado deja la
-- plataforma sin administracion.
--
-- ESQUEMA VOLCADO ANTES:
--   public.users
--     role          public.user_role NOT NULL DEFAULT 'student'
--                   enum: student, instructor, admin, mentor, council
--     is_suspended  boolean DEFAULT false
--     suspended_at, suspended_reason, suspended_by
--     email         text NOT NULL
--     id            uuid PK, FK users_id_fkey -> auth.users(id)
--
-- LAS COLUMNAS QUE SE PROTEGEN, Y POR QUE ESAS
--   role                            quitarle el rol es quitarle el acceso
--   is_suspended, suspended_at,
--   suspended_reason, suspended_by  suspenderla es lo mismo por otra puerta
--   email                           cambiar el correo de un admin es tomar la
--                                   cuenta: el acceso se recupera por correo
--
-- El resto NO se protege a proposito: nombre, biografia, avatar, redes. Un admin
-- tiene que poder editar su propio perfil, y bloquearlo entero habria roto eso.
--
-- SERVICE_ROLE TAMBIEN QUEDA DENTRO
-- Es lo contrario de lo que hacen los triggers de la 089 y la 091, que dejan
-- pasar cuando auth.uid() es NULL. Aqui no: la clave de servicio es justo por
-- donde entran el panel y las rutas de API, que es de lo que hay que proteger la
-- cuenta. Si el servidor pudiera, el agujero seguiria abierto.
--
-- Y SE PROTEGE TAMBIEN EL BORRADO
-- auth.admin.deleteUser() borra de auth.users y eso CASCADEA a public.users. Un
-- trigger BEFORE DELETE lo detiene, asi que borrar la cuenta admin desde el
-- panel falla en la base y no solo en la ruta.
--
-- ============================================================================
-- PROCEDIMIENTO DE EMERGENCIA
-- ============================================================================
-- Para cambiar de verdad el rol de un admin, suspenderlo o borrarlo, hay que
-- decirlo explicitamente EN LA MISMA TRANSACCION, desde el editor SQL:
--
--   BEGIN;
--     SET LOCAL app.permitir_cambio_admin = 'on';
--     UPDATE public.users SET role = 'student' WHERE email = 'quien@sea';
--   COMMIT;
--
-- El alcance LOCAL importa: muere con la transaccion, asi que no se queda
-- encendido por olvido. Y no sirve desde la aplicacion: set_config con alcance
-- de transaccion no sobrevive al pool de conexiones de PostgREST, que es
-- exactamente lo que se quiere.
--
-- Esta documentado tambien en docs/PROTEGER-LA-CUENTA-ADMIN.md.
--
-- OJO: hay UNA cuenta admin. Si se pierde el acceso a ella, este procedimiento
-- es la unica via de recuperacion, y necesita la contraseña de la base de datos.
-- ============================================================================
--
-- NO BORRA NI UNA FILA. No cambia el rol de nadie. Es reejecutable.
-- Y se prueba a si misma, en las tres direcciones que pediste.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El guardian
-- =====================================================

CREATE OR REPLACE FUNCTION public.proteger_la_cuenta_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_permitido boolean := coalesce(
    current_setting('app.permitir_cambio_admin', true) = 'on',
    false
  );
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' AND NOT v_permitido THEN
      RAISE EXCEPTION
        'No se puede borrar una cuenta de administracion. Hace falta SET LOCAL app.permitir_cambio_admin = ''on'' en la misma transaccion, desde el editor SQL.'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- A partir de aqui, UPDATE. Solo importa si la fila ERA de administracion:
  -- ascender a alguien A admin es otra cosa y no se toca.
  IF OLD.role <> 'admin' OR v_permitido THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION
      'No se puede cambiar el rol de una cuenta de administracion (se intento "%" -> "%"). Ver el procedimiento de emergencia de la migracion 100.',
      OLD.role, NEW.role
      USING ERRCODE = '42501';
  END IF;

  IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
     OR NEW.suspended_by IS DISTINCT FROM OLD.suspended_by THEN
    RAISE EXCEPTION
      'No se puede suspender ni reactivar una cuenta de administracion. Ver el procedimiento de emergencia de la migracion 100.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION
      'No se puede cambiar el correo de una cuenta de administracion: el acceso se recupera por correo, asi que cambiarlo es tomar la cuenta.'
      USING ERRCODE = '42501';
  END IF;

  -- Todo lo demas pasa: un admin edita su perfil como cualquiera.
  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.proteger_la_cuenta_admin() IS
  'Impide cambiar rol, suspension o correo de una cuenta admin, y borrarla, venga de donde venga, INCLUIDO service_role. Se exime con SET LOCAL app.permitir_cambio_admin = on en la misma transaccion, que es el procedimiento de emergencia documentado en la 100 y en docs/PROTEGER-LA-CUENTA-ADMIN.md. No bloquea el resto de columnas: un admin edita su perfil como cualquiera.';

DROP TRIGGER IF EXISTS trg_proteger_la_cuenta_admin ON public.users;

CREATE TRIGGER trg_proteger_la_cuenta_admin
  BEFORE UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_la_cuenta_admin();

-- =====================================================
-- 2. La prueba, en las tres direcciones
-- =====================================================
-- No se puede crear una fila admin de usar y tirar: public.users.id tiene clave
-- ajena a auth.users (users_id_fkey), comprobado. Asi que se toma una cuenta
-- student, se asciende DENTRO de esta transaccion, se prueba contra ella y se
-- devuelve a su rol. Si algo falla, el BEGIN/COMMIT lo deshace todo.

DO $prueba$
DECLARE
  v_cobaya uuid;
  v_rol    public.user_role;
BEGIN
  SELECT id, role INTO v_cobaya, v_rol
    FROM public.users
   WHERE role = 'student'
   ORDER BY created_at
   LIMIT 1;

  IF v_cobaya IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos una cuenta con rol student.';
  END IF;

  -- 0. Ascender a admin tiene que seguir siendo posible: la fila aun NO es admin
  UPDATE public.users SET role = 'admin' WHERE id = v_cobaya;
  IF (SELECT role FROM public.users WHERE id = v_cobaya) <> 'admin' THEN
    RAISE EXCEPTION 'PRUEBA 0 FALLIDA: no se pudo ascender a admin.';
  END IF;
  RAISE NOTICE 'PRUEBA 0  ascender A admin sigue siendo posible              PASA';

  -- 1. Ahora que ES admin: cambiarle el rol, imposible
  BEGIN
    UPDATE public.users SET role = 'student' WHERE id = v_cobaya;
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: se pudo cambiar el rol de una cuenta admin.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 1  cambiar el rol de un admin, imposible             PASA';
  END;

  -- 2. Suspenderla, tampoco
  BEGIN
    UPDATE public.users SET is_suspended = true, suspended_at = now() WHERE id = v_cobaya;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se pudo suspender una cuenta admin.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 2  suspender un admin, imposible                     PASA';
  END;

  -- 3. Cambiarle el correo, tampoco
  BEGIN
    UPDATE public.users SET email = 'otro-' || v_cobaya || '@nodo360.com' WHERE id = v_cobaya;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se pudo cambiar el correo de una cuenta admin.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 3  cambiar el correo de un admin, imposible          PASA';
  END;

  -- 4. Borrarla, tampoco
  BEGIN
    DELETE FROM public.users WHERE id = v_cobaya;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: se pudo borrar una cuenta admin.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 4  borrar un admin, imposible                        PASA';
  END;

  -- 5. Pero su PERFIL si se edita: un admin no queda congelado
  UPDATE public.users SET full_name = coalesce(full_name, '') WHERE id = v_cobaya;
  RAISE NOTICE 'PRUEBA 5  el perfil de un admin sigue siendo editable        PASA';

  -- 6. Y con el permiso de sesion, si se puede
  PERFORM set_config('app.permitir_cambio_admin', 'on', true);
  UPDATE public.users SET role = v_rol WHERE id = v_cobaya;
  PERFORM set_config('app.permitir_cambio_admin', '', true);

  IF (SELECT role FROM public.users WHERE id = v_cobaya) <> v_rol THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: con el permiso de sesion tampoco se pudo.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  con el permiso de sesion, si se puede             PASA';

  -- 7. Y una cuenta normal cambia de rol con normalidad
  UPDATE public.users SET role = 'instructor' WHERE id = v_cobaya;
  IF (SELECT role FROM public.users WHERE id = v_cobaya) <> 'instructor' THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: una cuenta normal no pudo cambiar de rol.';
  END IF;
  UPDATE public.users SET is_suspended = true WHERE id = v_cobaya;
  UPDATE public.users SET is_suspended = false WHERE id = v_cobaya;
  RAISE NOTICE 'PRUEBA 7  una cuenta normal cambia de rol y se suspende      PASA';

  -- Se devuelve a como estaba
  UPDATE public.users SET role = v_rol WHERE id = v_cobaya;
  IF (SELECT role FROM public.users WHERE id = v_cobaya) <> v_rol THEN
    RAISE EXCEPTION 'La cuenta de prueba no volvio a su rol original (%).', v_rol;
  END IF;
  RAISE NOTICE 'Cuenta de prueba devuelta a "%". Las ocho pruebas pasan.', v_rol;
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  to_regprocedure('public.proteger_la_cuenta_admin()') IS NOT NULL              AS funcion_creada,

  EXISTS (SELECT 1 FROM pg_trigger
           WHERE tgrelid = 'public.users'::regclass
             AND tgname = 'trg_proteger_la_cuenta_admin'
             AND NOT tgisinternal)                                              AS trigger_activo,

  -- Que vigila UPDATE y DELETE, no solo uno
  (SELECT count(*) FROM pg_trigger
    WHERE tgrelid = 'public.users'::regclass
      AND tgname = 'trg_proteger_la_cuenta_admin'
      AND NOT tgisinternal
      AND (tgtype & 16) > 0)                                                    AS vigila_update,
  (SELECT count(*) FROM pg_trigger
    WHERE tgrelid = 'public.users'::regclass
      AND tgname = 'trg_proteger_la_cuenta_admin'
      AND NOT tgisinternal
      AND (tgtype & 8) > 0)                                                     AS vigila_delete,

  -- Que NO exime a service_role por ausencia de JWT
  NOT (pg_get_functiondef('public.proteger_la_cuenta_admin()'::regprocedure)
        ILIKE '%auth.uid() IS NULL%')                                           AS no_exime_al_servicio,

  pg_get_functiondef('public.proteger_la_cuenta_admin()'::regprocedure)
    ILIKE '%app.permitir_cambio_admin%'                                         AS tiene_la_valvula,

  -- Estado, para ver que nada se movio
  (SELECT count(*) FROM public.users WHERE role = 'admin')                      AS admins,
  (SELECT count(*) FROM public.users WHERE role = 'admin' AND is_suspended)     AS admins_suspendidos,
  (SELECT count(*) FROM public.users)                                           AS usuarios,
  (SELECT count(*) FROM public.users WHERE role = 'student')                     AS estudiantes,
  (SELECT count(*) FROM public.users WHERE role = 'instructor')                  AS instructores,
  (SELECT count(*) FROM public.users WHERE role = 'mentor')                      AS mentores,

  CASE
    WHEN to_regprocedure('public.proteger_la_cuenta_admin()') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgrelid = 'public.users'::regclass
                    AND tgname = 'trg_proteger_la_cuenta_admin'
                    AND NOT tgisinternal)
     AND NOT (pg_get_functiondef('public.proteger_la_cuenta_admin()'::regprocedure)
               ILIKE '%auth.uid() IS NULL%')
     AND pg_get_functiondef('public.proteger_la_cuenta_admin()'::regprocedure)
           ILIKE '%app.permitir_cambio_admin%'
     AND (SELECT count(*) FROM public.users WHERE role = 'admin') = 1
     AND (SELECT count(*) FROM public.users WHERE role = 'admin' AND is_suspended) = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                           AS veredicto;
