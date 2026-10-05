-- ============================================================================
-- 085: los permisos de columna de public.users, por fin escritos
-- ============================================================================
-- ESTADO: APLICADA, y en parte superada por la 086. Comprobado contra la base
--   el 2026-10-05 (auditoria v2):
--
--   De las ONCE columnas que concede, authenticated puede escribir NUEVE:
--     full_name, bio, avatar_url, avatar_path, website, twitter, linkedin,
--     github, wants_beta_notification
--
--   Las dos que faltan son active_path_id y active_path_selected_at, y faltan A
--   PROPOSITO: la 086 —aplicada despues— las retiro para que la ruta activa se
--   escriba solo por activar_ruta(). O sea que esto no es un relleno a medias,
--   es una migracion posterior haciendo su trabajo. Las nueve que quedan son
--   exactamente las del formulario de perfil.
--
--   Y existen tambien su funcion tocar_updated_at() y su trigger
--   trigger_users_updated_at.
--
-- POR QUE EXISTE
--   La 049 hizo REVOKE ALL sobre public.users y devolvio solo GRANT SELECT de
--   seis columnas. Despues, alguien concedio permisos de UPDATE POR COLUMNA a
--   mano, en el editor, para que el perfil y la ruta activa siguieran
--   funcionando. Nunca se versionaron, asi que el repositorio no sabia que
--   existian y `has_table_privilege(...,'UPDATE')` los ocultaba: devuelve
--   FALSE cuando solo hay permisos de columna.
--
--   Comprobado el 28/09/2026, estas son las ONCE columnas que authenticated
--   puede escribir:
--
--     active_path_id           active_path_selected_at   avatar_path
--     avatar_url               bio                       full_name
--     github                   linkedin                  twitter
--     wants_beta_notification  website
--
--   Y la buena noticia: NINGUNA de las diez que dan privilegios o identidad
--   estaba concedida. peligrosas_escribibles = 0, update_de_tabla = false,
--   anon_escribe = false. Asi que la 084 es preventiva, no un incendio.
--
--   Esta migracion las declara para que el estado real este en el repositorio.
--   Es idempotente: conceder un permiso que ya se tiene no hace nada. Lo que
--   evita es que el dia que alguien haga otro REVOKE ALL, el perfil deje de
--   guardarse sin que nadie sepa por que, que es exactamente lo que ha pasado.
--
-- ⚠ Y ARREGLA UN FALLO QUE ESA LISTA DESTAPO
--   `updated_at` NO esta entre las once. Y components/profile/ProfileForm.tsx
--   lo envia en cada guardado:
--
--       const updates = { full_name: ..., updated_at: new Date().toISOString() }
--
--   Para escribir una columna hace falta el permiso de ESA columna, asi que
--   ese UPDATE falla entero con «permission denied for column updated_at»:
--   GUARDAR EL PERFIL NO FUNCIONA HOY.
--
--   La solucion no es conceder updated_at. Una marca de tiempo de modificacion
--   no la pone el cliente: la pone la base. No habia ningun trigger que lo
--   hiciera -comprobado en las 84 migraciones-, asi que se crea aqui. Con el
--   trigger, ProfileForm deja de enviar ese campo (va en la misma PR) y
--   updated_at queda correcto para TODAS las escrituras, tambien las de
--   service_role, que hasta ahora dependian de que alguien se acordara.
--
-- QUE NO CONCEDE, Y ES DELIBERADO
--   · updated_at: lo pone el trigger.
--   · role, is_beta, is_beta_enabled, is_suspended, suspended_*, id, email,
--     created_at: las retira la 084 y no deben volver. Todo lo que las toca va
--     por service_role.
--   · last_seen_at: ningun codigo la escribe.
--
-- UNA OBSERVACION, SIN TOCAR NADA
--   bio, website, twitter, linkedin y github estan concedidas y NINGUN codigo
--   las escribe: ProfileForm solo manda full_name y el avatar. Se conservan
--   porque son columnas del propio perfil y no dan ningun privilegio, pero si
--   el formulario no va a crecer, se pueden retirar.
--
-- REEJECUTABLE: GRANT idempotente y CREATE OR REPLACE en la funcion.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Las once columnas que el dueño de la fila puede escribir
-- ----------------------------------------------------------------------------
-- Ninguna da permisos ni cambia la identidad: son el perfil y la ruta elegida.
-- El alcance a la fila propia lo decide la RLS de public.users, no este GRANT.
GRANT UPDATE (
  full_name,
  bio,
  avatar_url,
  avatar_path,
  website,
  twitter,
  linkedin,
  github,
  wants_beta_notification,
  active_path_id,
  active_path_selected_at
) ON public.users TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. updated_at lo pone la base, no el cliente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tocar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.tocar_updated_at() IS
  'Pone updated_at en cada UPDATE. Nace en la 085 porque public.users no tenia ninguno y ProfileForm mandaba la fecha desde el navegador, cosa que fallaba: updated_at no esta entre las columnas con permiso de escritura para authenticated, y no debe estarlo.';

-- SECURITY INVOKER a proposito: un trigger que solo toca NEW no necesita
-- privilegios ajenos, y DEFINER aqui seria ampliar el alcance sin motivo.

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.tocar_updated_at();


-- ----------------------------------------------------------------------------
-- 3. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     escribibles            -> las once de arriba, en orden alfabético
--     n_escribibles          -> 11
--     peligrosas             -> NULL (vacío)
--     updated_at_escribible  -> false   la pone el trigger, no el cliente
--     trigger_puesto         -> true
--     veredicto              -> TODO CORRECTO
SELECT
  string_agg(c.column_name, ', ' ORDER BY c.column_name) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
  )                                                                     AS escribibles,

  count(*) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
  )                                                                     AS n_escribibles,

  string_agg(c.column_name, ', ' ORDER BY c.column_name) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
      AND c.column_name IN (
        'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
        'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
      )
  )                                                                     AS peligrosas,

  has_column_privilege('authenticated', 'public.users', 'updated_at', 'UPDATE')
                                                                        AS updated_at_escribible,

  EXISTS (SELECT 1 FROM pg_trigger t
           WHERE t.tgrelid = 'public.users'::regclass
             AND t.tgname = 'trigger_users_updated_at'
             AND NOT t.tgisinternal)                                    AS trigger_puesto,

  CASE
    WHEN count(*) FILTER (
      WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
        AND c.column_name IN (
          'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
          'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
        )
    ) = 0
     AND EXISTS (SELECT 1 FROM pg_trigger t
                  WHERE t.tgrelid = 'public.users'::regclass
                    AND t.tgname = 'trigger_users_updated_at'
                    AND NOT t.tgisinternal)
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                   AS veredicto

  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name   = 'users';
