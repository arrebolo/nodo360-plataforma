-- ============================================================================
-- 086: la ruta activa solo se escribe por activar_ruta()
-- ============================================================================
-- ESTADO: APLICADA. Comprobado contra la base el 2026-10-05 (auditoria v2):
--   ni active_path_id ni active_path_selected_at son escribibles por
--   authenticated, que es justo lo que retira. Encaja con la 085, que las
--   concedia: esta es posterior y manda.
--
-- QUE HACE
--   Retira el UPDATE de columna sobre active_path_id y active_path_selected_at
--   para authenticated y para anon. A partir de aqui, la unica forma de cambiar
--   la ruta activa de alguien es la funcion public.activar_ruta(), que es
--   SECURITY DEFINER y solo escribe la fila de auth.uid().
--
-- POR QUE AHORA Y NO EN LA 084
--   La 084 dejo esas dos columnas a proposito: retirarlas entonces habria roto
--   "Empezar esta ruta" hasta que la 083 estuviese aplicada Y su codigo
--   desplegado. Las dos condiciones se cumplen ya:
--
--     083 aplicada en produccion, con veredicto TODO CORRECTO
--     el codigo desplegado: /api/user/select-path hace
--         .rpc('activar_ruta', { p_slug: slug })
--     y "Empezar esta ruta" funciona en produccion, comprobado por el usuario
--
--   Esto tambien corrige, en parte, a la 085: esa migracion declaro las once
--   columnas que authenticated podia escribir porque era el estado real de la
--   base, incluidas estas dos. Ahora quedan nueve. No se reescribe la 085
--   -esta aplicada- sino que se avanza desde ella.
--
-- POR QUE NO ROMPE NADA: COMPROBADO CONTRA main
--   Ni una sola escritura de active_path_id o active_path_selected_at desde el
--   cliente de sesion en todo el repositorio. Buscado con grep sobre app/, lib/
--   y components/, filtrando por update, upsert e insert: cero resultados.
--
--   La unica escritura viva es la de dentro de activar_ruta(), y a esa no le
--   afecta ningun GRANT de tabla: SECURITY DEFINER se ejecuta con los permisos
--   de quien la creo.
--
-- LO QUE QUEDA ESCRIBIBLE, Y SIGUE SIENDO CORRECTO
--   Las nueve columnas del propio perfil: full_name, bio, avatar_url,
--   avatar_path, website, twitter, linkedin, github y
--   wants_beta_notification. Ninguna da privilegios.
--
--   updated_at sigue fuera, como dejo la 085: lo pone el trigger
--   trigger_users_updated_at, no el cliente.
--
-- QUE SE GANA
--   Que la ruta activa ya no se pueda cambiar llamando a PostgREST
--   directamente. Antes, con el permiso de columna, cualquiera con sesion podia
--   escribir su active_path_id a cualquier UUID -incluido el de una ruta
--   inactiva o inexistente- sin pasar por ninguna comprobacion. La funcion
--   valida que la ruta exista y este activa; un GRANT no valida nada.
--
-- REVERSION, si hiciera falta
--   GRANT UPDATE (active_path_id, active_path_selected_at)
--     ON public.users TO authenticated;
--
-- REEJECUTABLE: un REVOKE de un permiso que no se tiene no da error.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Fuera el permiso de columna
-- ----------------------------------------------------------------------------
REVOKE UPDATE (active_path_id)          ON public.users FROM authenticated, anon;
REVOKE UPDATE (active_path_selected_at) ON public.users FROM authenticated, anon;


COMMENT ON TABLE public.users IS 'Perfil de cada persona. SELECT limitado a seis columnas publicas desde la 049 (la fila propia entera va por mi_perfil()). UPDATE: authenticated solo puede escribir las NUEVE columnas inocuas de su propio perfil (full_name, bio, avatar_url, avatar_path, website, twitter, linkedin, github, wants_beta_notification). Desde la 084 no puede escribir role, is_beta, is_beta_enabled, is_suspended, suspended_*, id, email ni created_at. Desde la 086 tampoco active_path_id ni active_path_selected_at: eso va por public.activar_ruta(), que valida que la ruta exista y este activa. updated_at lo pone el trigger trigger_users_updated_at (085). auth.users, donde viven las cuentas, la gestiona Supabase y no se toca desde aqui.';


-- ----------------------------------------------------------------------------
-- 2. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     escribibles                 -> avatar_path, avatar_url, bio, full_name,
--                                    github, linkedin, twitter,
--                                    wants_beta_notification, website
--     n_escribibles               -> 9
--     ruta_activa_escribible      -> false   ninguna de las dos columnas
--     peligrosas                  -> NULL    lo que retiro la 084, sigue fuera
--     activar_ruta_disponible     -> true    la puerta sigue abierta
--     veredicto                   -> TODO CORRECTO
--
-- Si activar_ruta_disponible saliera false, NO seguir: se habria cerrado la
-- unica via que queda para elegir ruta.
SELECT
  string_agg(c.column_name, ', ' ORDER BY c.column_name) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
  )                                                                     AS escribibles,

  count(*) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
  )                                                                     AS n_escribibles,

  (has_column_privilege('authenticated', 'public.users', 'active_path_id', 'UPDATE')
   OR has_column_privilege('authenticated', 'public.users', 'active_path_selected_at', 'UPDATE'))
                                                                        AS ruta_activa_escribible,

  string_agg(c.column_name, ', ' ORDER BY c.column_name) FILTER (
    WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
      AND c.column_name IN (
        'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
        'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
      )
  )                                                                     AS peligrosas,

  EXISTS (
    SELECT 1 FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.proname = 'activar_ruta'
       AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )                                                                     AS activar_ruta_disponible,

  CASE
    WHEN NOT has_column_privilege('authenticated', 'public.users', 'active_path_id', 'UPDATE')
     AND NOT has_column_privilege('authenticated', 'public.users', 'active_path_selected_at', 'UPDATE')
     AND count(*) FILTER (
       WHERE has_column_privilege('authenticated', 'public.users', c.column_name, 'UPDATE')
         AND c.column_name IN (
           'id', 'email', 'created_at', 'role', 'is_beta', 'is_beta_enabled',
           'is_suspended', 'suspended_at', 'suspended_reason', 'suspended_by'
         )
     ) = 0
     AND EXISTS (
       SELECT 1 FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
          AND p.proname = 'activar_ruta'
          AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
     )
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                   AS veredicto

  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name   = 'users';
