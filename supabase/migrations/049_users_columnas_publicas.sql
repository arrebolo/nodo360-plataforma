-- ============================================================================
-- 049: la clave anonima deja de leer el correo de nadie
-- ============================================================================
-- ESTADO: ESCRITA, SIN APLICAR (24/09/2026).
--   Es DDL: no se puede aplicar por PostgREST, hay que ejecutarla en el SQL
--   Editor de Supabase. Antes hay que mirar la salida de pg_policies para las
--   tablas que toca, por si hay alguna politica FOR ALL que este fichero no
--   contempla. Comprobacion antes y despues: node scripts/auditar-clave-anonima.mjs
--
-- EL PROBLEMA
--   Con la clave anonima —la que va en el HTML de cualquier pagina del sitio—
--   se leen 3 filas de public.users con sus 23 columnas, correo incluido:
--
--     admin@nodo360.com (mentor) · [admin] (admin) · [instructor] (instructor)
--
--   Son exactamente los tres usuarios cuyo `role` no es 'student'. La politica
--   de filas esta pensada para alimentar el listado publico /mentores, y hace
--   bien en dejar ver esas filas: lo que sobra son las columnas.
--
--   Los 23 alumnos NO estan expuestos. El alcance es de tres cuentas internas,
--   pero son tres correos reales servidos a quien abra la consola.
--
-- QUE NECESITAN DE VERDAD LAS PAGINAS PUBLICAS
--   /mentores            -> id, full_name, avatar_url, role
--   /mentores/[id]       -> id, full_name, avatar_url, bio, created_at
--   /instructores        -> users(id, full_name, avatar_url) embebido
--   /instructores/[id]   -> users(id, full_name, avatar_url) embebido
--   /verificar/[codigo]  -> full_name  (ver el cambio de codigo mas abajo)
--
--   Ninguna usa email, website, twitter, linkedin, github, is_suspended,
--   suspended_reason, is_beta, last_seen_at ni active_path_id.
--
-- POR QUE UN REVOKE POR COLUMNA NO BASTA
--   Lo dejo escrito la migracion 025: un GRANT de tabla y un GRANT de columna
--   son privilegios independientes y acumulativos. Mientras exista el GRANT
--   sobre la tabla entera, quitar una columna no resta nada. Hay que retirar
--   el privilegio de tabla primero y volver a conceder solo las columnas.
--
-- QUE NO TOCA
--   El rol `authenticated`. Sus consultas incluyen la fila propia, y ahi un
--   usuario necesita columnas que aqui se retiran (is_suspended en el callback
--   de login, is_beta en el layout privado, active_path_id en /rutas,
--   avatar_path en el perfil). Un GRANT de columna no distingue la fila propia
--   de las ajenas, asi que ese caso no se arregla por aqui: si la politica de
--   filas resulta servir tambien a `authenticated` esas tres filas con correo,
--   se corrige con una politica de filas o una vista, en su propia migracion.
--
--   `service_role` conserva GRANT ALL: las rutas de admin que leen correos
--   (/api/admin/users/beta) ya usan createAdminClient().
--
-- CAMBIO DE CODIGO QUE ACOMPANA A ESTA MIGRACION
--   app/verificar/[verificationCode]/page.tsx pedia 'full_name, email' y usaba
--   la parte local del correo como nombre de respaldo. Al retirar la columna,
--   PostgREST devolveria 42501 para la consulta ENTERA y la pagina mostraria
--   "Estudiante" tambien para los 9 titulares que hoy si tienen nombre. Por eso
--   el select pasa a pedir solo 'full_name'. Se pierde el respaldo por correo,
--   que afectaba a 1 usuario visible sin full_name y mostraba su buzon.
--
-- COMPROBACION PREVIA (clave anonima, 24/09/2026)
--   users: anon ve 3 de 23 · columnas expuestas: 23 · correos legibles: 3
-- ============================================================================

BEGIN;

-- 1. Retirar el privilegio de tabla, que es el que hace inutil todo lo demas.
REVOKE ALL ON public.users FROM anon;

-- 2. Devolver solo lo que las paginas publicas pintan.
--    `role` entra porque /mentores filtra por el y porque distingue al equipo;
--    no dice nada que el propio listado no muestre ya.
GRANT SELECT (
  id,
  full_name,
  avatar_url,
  role,
  bio,
  created_at
) ON public.users TO anon;

-- 3. El rol de servicio no se toca.
GRANT ALL ON public.users TO service_role;

COMMIT;


-- ============================================================================
-- COMPROBACIONES
-- ============================================================================
-- 1. Con la clave ANONIMA, pedir el correo debe fallar:
--
--      GET /rest/v1/users?select=email
--      QUE DEBE SALIR: 401/403 con code 42501.
--
-- 2. Con la clave ANONIMA, el listado de mentores debe seguir entero:
--
--      GET /rest/v1/users?select=id,full_name,avatar_url,role
--      QUE DEBE SALIR: las mismas 3 filas de antes.
--
-- 3. Ninguna columna sensible sobrevive:
--
--      GET /rest/v1/users?select=is_suspended
--      GET /rest/v1/users?select=active_path_id
--      QUE DEBE SALIR: 42501 en ambas.
--
-- 4. Un `select=*` con clave anonima devuelve solo las 6 columnas concedidas.
--
-- 5. Las paginas /mentores, /mentores/[id], /instructores, /instructores/[id]
--    y /verificar/[codigo] se abren sin sesion y muestran lo mismo que antes,
--    salvo el nombre de respaldo por correo descrito arriba.
