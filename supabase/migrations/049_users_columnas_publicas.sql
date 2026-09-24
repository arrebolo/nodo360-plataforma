-- ============================================================================
-- 049: el correo de los usuarios deja de ser legible
-- ============================================================================
-- ESTADO: ESCRITA, SIN APLICAR (24/09/2026).
--   Es DDL: hay que ejecutarla en el SQL Editor de Supabase. El codigo que la
--   acompana ya esta en la rama y debe desplegarse ANTES o a la vez (ver mas
--   abajo). Comprobacion: node scripts/auditar-clave-anonima.mjs
--
-- EL PROBLEMA, EN DOS CAPAS
--
--   Capa 1, la que se vio primero. Con la clave anonima —la que va en el HTML
--   de cualquier pagina— se leen 3 filas de public.users con sus 23 columnas,
--   correo incluido. Son los tres usuarios de rol distinto de 'student', que
--   la politica de filas expone a proposito para alimentar /mentores. Lo que
--   sobra no son las filas: son las columnas.
--
--   Capa 2, la grave, que aparecio al leer pg_policies. `users` tiene la
--   politica "users_read_all_authenticated" con USING true para el rol
--   `authenticated`: **cualquier alumno registrado lee las 23 filas enteras**,
--   con correo, is_suspended, suspended_reason y todo lo demas.
--
--   Y no hace falta ni la consola. GET /api/gamification/leaderboard usa el
--   cliente de sesion, embebe users!inner(id, full_name, email) y **devuelve
--   el correo en su JSON**. Comprobado el 24/09/2026: sin sesion devuelve 0
--   entradas; con la sesion de cualquier alumno, 15 correos.
--
-- POR QUE NO SE ARREGLA SOLO CON POLITICAS NI SOLO CON GRANTS
--   Lo que se quiere es "mi fila entera, de los demas solo lo publico". Una
--   politica decide por FILA y no sabe que columnas se piden; un GRANT decide
--   por COLUMNA y es por rol, no distingue la fila propia de las ajenas.
--   Ninguno de los dos lo expresa por su cuenta.
--
--   De las dos formas de combinarlos se elige la barata:
--
--     A) Politica de filas restringida a la fila propia + una vista publica
--        para los demas. Obliga a reescribir ~40 embeds (comentarios,
--        mensajeria, proyectos, moderacion, instructores...) y depende de que
--        PostgREST sepa embeber una vista por su clave ajena.
--
--     B) GRANT de columna con las seis publicas + una funcion para la fila
--        propia. Los ~40 embeds siguen funcionando sin tocarlos, porque casi
--        todos piden id/full_name/avatar_url. Cambian 13 sitios.  <-- esta
--
--   Y como la politica "users_read_all_authenticated" pasa a exponer solo seis
--   columnas, deja de ser un problema y no hace falta tocarla.
--
-- POR QUE UN REVOKE POR COLUMNA NO BASTA
--   Lo dejo escrito la 025: un GRANT de tabla y uno de columna son privilegios
--   independientes y acumulativos. Mientras exista el GRANT sobre la tabla
--   entera, quitar una columna no resta nada. Hay que retirar el privilegio de
--   tabla primero y volver a conceder solo las columnas.
--
-- QUE NECESITAN DE VERDAD LAS PAGINAS
--   /mentores           -> id, full_name, avatar_url, role
--   /mentores/[id]      -> id, full_name, avatar_url, bio, created_at
--   /instructores[/id]  -> users(id, full_name, avatar_url) embebido
--   comentarios, mensajeria, proyectos, moderacion, leaderboard
--                       -> id, full_name, avatar_url
--   /verificar/[codigo] -> full_name
--
-- CODIGO QUE ACOMPANA A ESTA MIGRACION (ya en la rama)
--
--   Fuga cerrada en el propio codigo, independientemente de la RLS:
--     app/api/gamification/leaderboard/route.ts  deja de pedir y de devolver
--       el correo; components/gamification/Leaderboard.tsx pierde el campo.
--     app/(private)/dashboard/leaderboard/page.tsx y admin/gamificacion
--       dejan de usar la parte local del correo como nombre de respaldo.
--
--   Lectura de la fila propia -> mi_perfil() (lib/auth/miPerfil.ts):
--     app/(auth)/auth/callback/route.ts        is_suspended
--     app/(private)/layout.tsx                 is_beta
--     app/(private)/dashboard/rutas/page.tsx   active_path_id
--     app/(private)/dashboard/rutas/[routeSlug]/page.tsx  active_path_id
--     app/(private)/dashboard/perfil/page.tsx  avatar_path
--
--   Lectura privilegiada de correo ajeno -> createAdminClient(), en sitios que
--   ya estaban detras de requireAdmin, requireMentor o un control de rol:
--     admin/cursos/pendientes/[id]/page.tsx    (3 consultas)
--     dashboard/mentor/cursos/pendientes/[id]/page.tsx  (3 consultas)
--     admin/usuarios/[id]/page.tsx             muestra el correo a proposito
--     lib/certificates/generator.ts            (2 consultas)
--
--   Pedian el correo sin usarlo, y dejan de pedirlo:
--     admin/cursos/pendientes/page.tsx · dashboard/mentor/cursos/pendientes/page.tsx
--     lib/admin/auth.ts · lib/projects/index.ts (2 embeds)
--
--   El correo propio sale ya de la sesion, no de la tabla:
--     lib/auth/requireMentor.ts · app/api/admin/users/[id]/reset-course/route.ts
--
-- QUE NO SE TOCA
--   `service_role` conserva GRANT ALL. Las escrituras de admin
--   (/api/admin/users/*) ya iban por createAdminClient().
--
-- COMPROBACION PREVIA (24/09/2026)
--   anon: 3 de 23 filas, 23 columnas, 3 correos
--   authenticated: 23 de 23 filas enteras (users_read_all_authenticated)
--   GET /api/gamification/leaderboard con sesion: 15 correos en el JSON
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Retirar el privilegio de tabla, que es lo que hace inutil lo demas
-- ============================================================================

REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM authenticated;

-- ============================================================================
-- 2. Devolver solo las columnas publicas
-- ============================================================================
-- `role` entra porque /mentores filtra por el y porque el propio listado ya lo
-- muestra. Fuera quedan email, is_suspended, suspended_reason, suspended_by,
-- suspended_at, is_beta, is_beta_enabled, wants_beta_notification,
-- last_seen_at, active_path_id, active_path_selected_at, avatar_path, website,
-- twitter, linkedin, github y updated_at.

GRANT SELECT (
  id,
  full_name,
  avatar_url,
  role,
  bio,
  created_at
) ON public.users TO anon, authenticated;

-- ============================================================================
-- 3. Lo que un usuario puede escribir de su propia ficha
-- ============================================================================
-- El REVOKE de arriba se llevo tambien el UPDATE. Estas son las columnas que
-- el propio usuario edita hoy: avatar (/api/user/avatar y avatar/upload),
-- ruta activa (/api/user/select-path) y el aviso de beta (/beta).
-- El resto quedan para el cliente de servicio. La politica de filas sigue
-- decidiendo QUE filas puede tocar; esto decide que columnas.

GRANT UPDATE (
  full_name,
  avatar_url,
  avatar_path,
  bio,
  website,
  twitter,
  linkedin,
  github,
  active_path_id,
  active_path_selected_at,
  wants_beta_notification
) ON public.users TO authenticated;

-- ============================================================================
-- 4. La puerta a la fila propia, entera
-- ============================================================================
-- Un GRANT de columna no distingue la fila propia de las ajenas, asi que
-- cerrar las columnas ajenas cierra tambien las propias. Esta funcion las
-- devuelve, y solo las de auth.uid(). Sin sesion no devuelve nada.

CREATE OR REPLACE FUNCTION public.mi_perfil()
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.mi_perfil IS
  'La fila propia de users, con todas sus columnas. Necesaria porque desde la 049 authenticated solo tiene GRANT sobre las seis columnas publicas, y un GRANT de columna no distingue la fila propia de las ajenas.';

REVOKE ALL ON FUNCTION public.mi_perfil() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mi_perfil() TO authenticated, service_role;

-- ============================================================================
-- 5. El rol de servicio no se toca
-- ============================================================================

GRANT ALL ON public.users TO service_role;

COMMIT;


-- ============================================================================
-- COMPROBACIONES
-- ============================================================================
-- 1. Con la clave ANONIMA y con sesion de alumno, el correo debe fallar:
--      GET /rest/v1/users?select=email          -> 42501
--      GET /rest/v1/users?select=is_suspended   -> 42501
--
-- 2. Lo publico debe seguir entero:
--      GET /rest/v1/users?select=id,full_name,avatar_url,role
--      QUE DEBE SALIR: 3 filas sin sesion, 23 con sesion de alumno.
--
-- 3. El leaderboard ya no lleva correos:
--      GET /api/gamification/leaderboard con sesion
--      QUE DEBE SALIR: ninguna clave `email` en el JSON.
--
-- 4. Cada uno lee su ficha entera:
--      POST /rest/v1/rpc/mi_perfil con sesion -> una fila con las 23 columnas
--      POST /rest/v1/rpc/mi_perfil sin sesion -> []
--
-- 5. Un usuario sigue pudiendo cambiar su avatar y su ruta activa, y NO puede
--    cambiarse el rol ni levantarse una suspension:
--      PATCH /rest/v1/users?id=eq.<propio>  {"role":"admin"}      -> 42501
--      PATCH /rest/v1/users?id=eq.<propio>  {"is_suspended":false} -> 42501
--
-- 6. A mano: iniciar sesion (callback lee is_suspended), abrir el panel
--    privado (banner beta), /dashboard/rutas, /dashboard/perfil, /mentores,
--    /instructores, la ficha de un usuario en el panel de admin, y aprobar un
--    curso desde admin y desde mentor (ambos mandan correo al instructor).
