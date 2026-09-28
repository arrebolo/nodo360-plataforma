-- ============================================================================
-- 083: activar una ruta sin que nadie pueda escribir en public.users
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/083-aplicar.sql
--
-- EL PROBLEMA
--   La migracion 049 hizo REVOKE ALL ON public.users FROM authenticated y
--   devolvio solo GRANT SELECT de seis columnas. No hay ningun GRANT UPDATE
--   sobre public.users en ninguna de las 82 migraciones del repositorio.
--
--   Y ocho sitios del codigo escriben en public.users. CUATRO con el cliente
--   de SESION (los marcados) y cuatro con service_role:
--
--     app/api/user/select-path            active_path_id  <- sesion
--     app/api/user/avatar                 avatar_url  <- sesion
--     app/api/user/avatar/upload          avatar_url  <- sesion
--     components/profile/ProfileForm      el perfil, desde el navegador  <- sesion
--     app/api/invites/consume             role            (ya usa service_role)
--     app/api/admin/users/[id]            varias
--     app/api/admin/users/[id]/role       role
--     app/api/admin/users/beta            is_beta, wants_beta_notification
--
--   Esta migracion arregla el PRIMERO. Los otros siete necesitan su propia
--   decision, y no la misma: ver el final.
--
-- POR QUE UNA FUNCION Y NO UN GRANT DE COLUMNA
--   Las dos opciones cierran el caso de la ruta activa. La funcion es
--   estrictamente mas restrictiva, por cinco razones:
--
--   1. NO HACE FALTA NINGUN PRIVILEGIO DE ESCRITURA. Con la funcion,
--      `authenticated` sigue sin poder tocar public.users por ninguna via. Un
--      GRANT, aunque sea de dos columnas, es un privilegio que antes no habia.
--
--   2. UN GRANT DE COLUMNA VALE PARA TODAS LAS FILAS. Que solo se pueda
--      cambiar la fila propia dependeria enteramente de que exista, y sea
--      correcta, una politica RLS de UPDATE sobre public.users. Desde aqui no
--      puedo ver las politicas de esa tabla -PostgREST no expone pg_policies-
--      y en este mismo proyecto acabamos de encontrar DOS politicas abiertas
--      sobre user_badges que nadie habia versionado. Depender de menos RLS es
--      la decision prudente.
--
--   3. LA FUNCION VALIDA. Comprueba que la ruta exista y este activa antes de
--      escribir. Un GRANT no puede comprobar nada: aceptaria cualquier UUID,
--      incluido el de una ruta desactivada o inexistente.
--
--   4. ARREGLA UN FALLO DE PROPINA. Los 8 usuarios con ruta activa tienen
--      active_path_selected_at en NULL, porque el codigo nunca la escribia. La
--      funcion la pone.
--
--   5. ES EL PATRON DE LA CASA. La 049 creo mi_perfil() como la puerta para
--      LEER la fila propia. Una puerta para esta escritura es simetrica. Y la
--      identidad sale de auth.uid() dentro de la funcion, nunca de un
--      parametro, que es la regla del proyecto.
--
-- LO QUE NO HACE, Y ES DELIBERADO
--   No concede ni revoca NADA sobre public.users. En particular NO revoca el
--   UPDATE de authenticated, porque si hoy existe -concedido a mano, sin
--   versionar- los otros siete sitios dependen de el y retirarlo dejaria a la
--   gente sin poder editar su perfil ni su avatar.
--
-- CORRECCION (084, 28/09/2026): AQUI HABIA UN AVISO FALSO
--   Esta cabecera decia: «app/api/invites/consume escribe `role` con el cliente
--   de SESION». NO ES CIERTO. Esa ruta usa supabaseAdmin, o sea service_role,
--   que es exactamente lo correcto. El error vino de un grep que devolvio el
--   primer cliente del fichero en lugar del de esa escritura.
--
--   Comprobado despues escritura por escritura: las CUATRO rutas que tocan
--   columnas de privilegio -invites/consume, admin/users/[id],
--   admin/users/[id]/role y admin/users/beta- usan todas service_role. Las
--   cuatro que usan el cliente de sesion solo tocan columnas inocuas:
--   full_name, updated_at, avatar_url, avatar_path y active_path_id.
--
-- EL RIESGO REAL, QUE SIGUE EN PIE
--   Si alguna vez se concede un GRANT UPDATE amplio sobre public.users a
--   authenticated, con una politica de fila propia, entonces CUALQUIER USUARIO
--   podria ponerse role = 'admin' llamando a PostgREST directamente: la clave
--   anonima es publica y la API REST es alcanzable sin pasar por la web, asi
--   que la comprobacion de admin del codigo no protege nada ahi.
--
--   Y eso no era hipotetico: la comprobacion posterior encontro permisos de
--   COLUMNA concedidos a mano y sin versionar sobre esta tabla. La 084 retira
--   los de las columnas que dan privilegios.
--
--   Asi que la regla para esos siete es:
--     · columnas inocuas que edita su dueno (full_name, bio, avatar_url,
--       website, twitter, linkedin, github) -> GRANT de COLUMNA + politica de
--       fila propia, o una funcion como esta.
--     · columnas que dan privilegios (role, is_beta, is_beta_enabled,
--       is_suspended) -> NUNCA a authenticated. Esas rutas tienen que usar
--       service_role o una funcion SECURITY DEFINER que compruebe quien llama.
--
-- REEJECUTABLE: CREATE OR REPLACE, y los GRANT son idempotentes.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. La puerta
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activar_ruta(p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_uid     UUID := auth.uid();
  v_ruta_id UUID;
BEGIN
  -- La identidad sale de la sesion. Sin sesion no se activa nada, y esto
  -- tambien cubre a anon si algun dia recuperase el EXECUTE por error.
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hace falta una sesion para activar una ruta'
      USING ERRCODE = '42501';
  END IF;

  -- La ruta tiene que existir y estar activa. Un slug que no cumpla las dos
  -- cosas no escribe nada.
  SELECT lp.id
    INTO v_ruta_id
    FROM public.learning_paths lp
   WHERE lp.slug = p_slug
     AND lp.is_active
   LIMIT 1;

  IF v_ruta_id IS NULL THEN
    RAISE EXCEPTION 'No hay ninguna ruta activa con el slug %', p_slug
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.users u
     SET active_path_id          = v_ruta_id,
         active_path_selected_at = now()
   WHERE u.id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe la fila de perfil del usuario %', v_uid
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_ruta_id;
END
$fn$;

COMMENT ON FUNCTION public.activar_ruta(TEXT) IS
  'Pone users.active_path_id y active_path_selected_at para auth.uid(), y solo para auth.uid(). Existe porque la 049 revoco UPDATE sobre public.users a authenticated: es la puerta para esta escritura, como mi_perfil() lo es para leer la fila propia. Valida que la ruta exista y este activa. NO se sustituye por un GRANT UPDATE sobre la tabla: eso abriria la columna role a cualquiera con una politica de fila propia.';


-- ----------------------------------------------------------------------------
-- 2. Quien puede llamarla
-- ----------------------------------------------------------------------------
-- La regla de la casa: toda SECURITY DEFINER nace sin EXECUTE para PUBLIC.
REVOKE ALL ON FUNCTION public.activar_ruta(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activar_ruta(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.activar_ruta(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activar_ruta(TEXT) TO service_role;


-- ----------------------------------------------------------------------------
-- 3. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     existe                 -> true
--     es_security_definer    -> true
--     search_path            -> {search_path=public,pg_temp}
--     authenticated_ejecuta  -> true
--     anon_ejecuta           -> false
--     auth_update_en_users   -> lo que haya; esta migración NO lo cambia
--     veredicto              -> TODO CORRECTO
--
-- auth_update_en_users es informativo y es el dato que faltaba: si sale TRUE,
-- alguien concedió ese UPDATE a mano y sin versionar, y hay que decidir qué
-- hacer con los otros siete sitios antes de retirarlo. Si sale FALSE, esta
-- migración es justo lo que hacía falta y los otros siete están rotos.
SELECT
  true                                                              AS existe,
  p.prosecdef                                                       AS es_security_definer,
  array_to_string(p.proconfig, ', ')                                AS search_path,
  has_function_privilege('authenticated', p.oid, 'EXECUTE')          AS authenticated_ejecuta,
  has_function_privilege('anon', p.oid, 'EXECUTE')                   AS anon_ejecuta,
  has_table_privilege('authenticated', 'public.users', 'UPDATE')     AS auth_update_en_users,
  CASE
    WHEN p.prosecdef
     AND array_to_string(p.proconfig, ', ') LIKE '%search_path=%'
     AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
     AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                               AS veredicto
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname = 'activar_ruta';
