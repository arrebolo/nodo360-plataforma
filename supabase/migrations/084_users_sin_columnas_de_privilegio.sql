-- ============================================================================
-- 084: authenticated no puede escribir ninguna columna que dé privilegios
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/084-aplicar.sql
--
-- POR QUE EXISTE
--   Al comprobar los privilegios sobre public.users salio esto:
--
--       has_table_privilege('authenticated','public.users','UPDATE')    -> false
--       has_column_privilege(...,'active_path_id','UPDATE')             -> TRUE
--
--   O sea que hay permisos de COLUMNA concedidos a mano y sin versionar. La
--   049 hizo REVOKE ALL y no devolvio ninguno: alguien los volvio a conceder
--   despues, en el editor, para que el perfil y la ruta activa siguieran
--   funcionando. Nunca se escribio en el repositorio, asi que no se sabe
--   cuales son sin preguntarselo a la base.
--
--   El riesgo no es que el perfil funcione: es que no se sabe DONDE ACABA ese
--   permiso. Si alcanza a `role`, cualquier persona con sesion podria ponerse
--   role = 'admin' llamando a PostgREST directamente. La clave anonima es
--   publica -viaja en el JS de cada pagina- y la API REST es alcanzable sin
--   pasar por la web, asi que la comprobacion de admin del codigo no protege
--   nada ahi.
--
--   Para verlo antes de aplicar esto: tmp/columnas-update-users.sql, que lo
--   dice en una fila.
--
-- QUE HACE
--   Retira el UPDATE de authenticated y de anon sobre diez columnas: las que
--   dan permisos y las que son identidad. Un REVOKE de un permiso que no se
--   tiene no da error, asi que esto es correcto y reejecutable tanto si estaban
--   concedidas como si no.
--
-- POR QUE NO ROMPE NADA: COMPROBADO ESCRITURA POR ESCRITURA
--   Ocho sitios del codigo escriben en public.users. De ellos, los CUATRO que
--   tocan columnas de privilegio ya usan service_role, que se salta todo esto:
--
--     app/api/invites/consume          role          supabaseAdmin  ✔
--     app/api/admin/users/[id]         varias        supabaseAdmin  ✔
--     app/api/admin/users/[id]/role    role          supabaseAdmin  ✔
--     app/api/admin/users/beta         is_beta...    supabaseAdmin  ✔
--
--   Y los cuatro que usan el cliente de SESION solo tocan columnas inocuas,
--   que esta migracion NO retira:
--
--     components/profile/ProfileForm   full_name, updated_at, avatar_url,
--                                      avatar_path
--     app/api/user/avatar              avatar_url
--     app/api/user/avatar/upload       avatar_url
--     app/api/user/select-path         active_path_id
--
--   (En un mensaje anterior dije que invites/consume escribia `role` con el
--   cliente de sesion. Era FALSO: usa supabaseAdmin. El grep me dio el primer
--   cliente del fichero, no el de esa escritura.)
--
-- QUE NO RETIRA, Y POR QUE
--   · full_name, avatar_url, avatar_path, updated_at, bio, website, twitter,
--     linkedin, github: son del propio perfil y no dan ningun privilegio.
--   · active_path_id y active_path_selected_at: la 083 crea activar_ruta()
--     para no necesitar este permiso, pero retirarlo AQUI romperia "Empezar
--     esta ruta" hasta que la 083 este aplicada Y su codigo desplegado. Se
--     retira despues, en su propia migracion, cuando las dos cosas esten.
--   · last_seen_at y wants_beta_notification: ningun codigo las escribe con el
--     cliente de sesion, pero tampoco dan privilegios. Se dejan para no
--     ampliar el alcance de esta migracion.
--
-- LO QUE ESTO NO ARREGLA
--   Que se pueda escribir una columna no dice de QUE FILA. Eso lo decide la
--   RLS de public.users, que desde aqui no se puede leer -PostgREST no expone
--   pg_policies-. Lo que hace esta migracion es quitar la pregunta de encima:
--   si la columna no se puede escribir, da igual lo que diga la politica.
--
-- REVERSION, si algo dependiera de esto sin que lo hayamos visto
--   GRANT UPDATE (role) ON public.users TO authenticated;
--   ...y la columna que sea. Pero antes conviene mirar por que.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Las que dan permisos
-- ----------------------------------------------------------------------------
REVOKE UPDATE (role)             ON public.users FROM authenticated, anon;
REVOKE UPDATE (is_beta)          ON public.users FROM authenticated, anon;
REVOKE UPDATE (is_beta_enabled)  ON public.users FROM authenticated, anon;


-- ----------------------------------------------------------------------------
-- 2. Las que levantan una sanción
-- ----------------------------------------------------------------------------
REVOKE UPDATE (is_suspended)     ON public.users FROM authenticated, anon;
REVOKE UPDATE (suspended_at)     ON public.users FROM authenticated, anon;
REVOKE UPDATE (suspended_reason) ON public.users FROM authenticated, anon;
REVOKE UPDATE (suspended_by)     ON public.users FROM authenticated, anon;


-- ----------------------------------------------------------------------------
-- 3. Las que son identidad
-- ----------------------------------------------------------------------------
-- Cambiar id o email desincronizaria public.users de auth.users, que es la
-- tabla que gobierna el inicio de sesion y que Supabase gestiona aparte.
REVOKE UPDATE (id)               ON public.users FROM authenticated, anon;
REVOKE UPDATE (email)            ON public.users FROM authenticated, anon;
REVOKE UPDATE (created_at)       ON public.users FROM authenticated, anon;


COMMENT ON TABLE public.users IS 'Perfil de cada persona. SELECT limitado a seis columnas publicas desde la 049 (la fila propia entera va por mi_perfil()). UPDATE: authenticated solo conserva las columnas inocuas del propio perfil; desde la 084 no puede escribir role, is_beta, is_beta_enabled, is_suspended, suspended_*, id, email ni created_at, porque la API REST es alcanzable con la clave anonima y las comprobaciones del codigo no llegan ahi. Todo lo que toque esas columnas va por service_role o por una funcion SECURITY DEFINER. auth.users, que es donde viven las cuentas, la gestiona Supabase y no se toca desde aqui.';


-- ----------------------------------------------------------------------------
-- 4. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     peligrosas_escribibles -> 0
--     peligrosas             -> NULL
--     escribibles            -> las inocuas que quedan; debería incluir
--                               full_name, avatar_url, avatar_path,
--                               updated_at y active_path_id
--     update_de_tabla        -> false
--     anon_escribe           -> false
--     veredicto              -> SIN RIESGO
SELECT
  count(*) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
      AND c.column_name IN (
        'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
        'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
      )
  )                                                                     AS peligrosas_escribibles,

  string_agg(c.column_name, ', ' ORDER BY c.column_name) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
      AND c.column_name IN (
        'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
        'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
      )
  )                                                                     AS peligrosas,

  string_agg(c.column_name, ', ' ORDER BY c.column_name) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
  )                                                                     AS escribibles,

  has_table_privilege('authenticated', 'public.users', 'UPDATE')          AS update_de_tabla,
  has_table_privilege('anon', 'public.users', 'UPDATE')                   AS anon_escribe,

  CASE
    WHEN count(*) FILTER (
      WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
        AND c.column_name IN (
          'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
          'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
        )
    ) = 0
     AND NOT has_table_privilege('authenticated', 'public.users', 'UPDATE')
     AND NOT has_table_privilege('anon', 'public.users', 'UPDATE')
      THEN 'SIN RIESGO'
    ELSE 'REVISAR: mira la columna peligrosas'
  END                                                                   AS veredicto

  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name   = 'users';
