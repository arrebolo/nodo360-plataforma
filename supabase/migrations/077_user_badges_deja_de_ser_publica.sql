-- ============================================================================
-- 077: user_badges deja de exponer quien gano que
-- ============================================================================
-- ESTADO: PROPUESTA. NO APLICADA. Pendiente de tu visto bueno.
--   Cuando se apruebe: tmp/077-aplicar.sql
--
-- LO QUE PASA HOY
--   Con la clave anonima, sin sesion:
--       select * from user_badges  ->  29 filas, con user_id
--
--   No identifica a nadie por si solo -un user_id es un UUID y public.users
--   esta cerrada desde la 049- pero permite enumerar cuantas cuentas hay, que
--   ha conseguido cada una y cuando. Es el tipo de dato que no cuesta nada
--   cerrar y que no hay ninguna razon para servir.
--
-- POR QUE PASA, EXACTAMENTE
--   La migracion 004 creo DOS politicas de SELECT sobre la misma tabla:
--
--     "Users can view own badges"            USING (auth.uid() = user_id)
--     "Users can view all badges for display" USING (true)
--
--   Las politicas de PostgreSQL se combinan con OR, no con AND. La segunda
--   concede todo lo que la primera restringe, asi que la primera nunca ha
--   servido para nada. No es un fallo de configuracion posterior: nacio asi.
--
--   El nombre de la segunda dice su intencion -"for display", ensenar insignias
--   ajenas en un perfil publico o una tabla de clasificacion-. Esa pantalla no
--   existe: el leaderboard vive en /dashboard/leaderboard, detras de sesion.
--
-- QUE ROMPERIA
--   Nada. Los ocho sitios que leen user_badges son paginas privadas
--   (/dashboard/badges, /dashboard/progreso, el panel de admin) y rutas de API
--   autenticadas:
--
--     app/(private)/admin/gamificacion/*        admin
--     app/(private)/dashboard/badges            la persona, sus propias
--     app/(private)/dashboard/progreso          la persona, sus propias
--     app/api/admin/badges/[id]                 admin, service_role
--     app/api/gamification/stats                la persona, sus propias
--
--   Ninguna pagina publica la consulta. Comprobado con grep sobre app/, lib/ y
--   components/ antes de escribir esto.
--
-- SI ALGUN DIA HAY PERFILES PUBLICOS
--   No se vuelve a "USING (true)". Se hace como la 049 con users: una funcion
--   SECURITY DEFINER que devuelva solo las insignias de un usuario concreto y
--   solo las columnas que se pinten. Una politica abierta no distingue entre
--   "ensenar el perfil de Ana" y "descargar la tabla entera".
--
-- REVERSION
--   CREATE POLICY "Users can view all badges for display"
--     ON public.user_badges FOR SELECT USING (true);
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Fuera la politica que lo abre todo
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all badges for display" ON public.user_badges;


-- ----------------------------------------------------------------------------
-- 2. La del propietario se reescribe para dejarla explicita
-- ----------------------------------------------------------------------------
-- Ya existia desde la 004 y es correcta. Se vuelve a crear para que este
-- fichero deje el estado final completo y no dependa de leer la 004.
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_badges IS
  'Insignias conseguidas por cada persona. SELECT restringido a la fila propia desde la 077: hasta entonces una politica USING (true) la servia entera a la clave anonima. Para ensenar insignias ajenas, funcion SECURITY DEFINER, no politica abierta.';


-- ----------------------------------------------------------------------------
-- 3. La comprobacion. Es lo ultimo, asi que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUE TIENE QUE SALIR:
--     politicas_select   -> 1        (solo la del propietario)
--     abiertas           -> 0        (ninguna con USING (true))
--     filas_en_la_tabla  -> 29       (no se borra nada)
--     veredicto          -> TODO CORRECTO
--
-- Y DESPUES, FUERA DEL EDITOR, la prueba que de verdad importa:
--     node tmp/comprobar-user-badges.mjs
--   Tiene que decir 0 filas visibles con la clave anonima.
SELECT
  count(*) FILTER (WHERE cmd = 'SELECT')                                AS politicas_select,
  count(*) FILTER (WHERE qual = 'true')                                 AS abiertas,
  (SELECT count(*) FROM public.user_badges)                             AS filas_en_la_tabla,
  CASE
    WHEN count(*) FILTER (WHERE cmd = 'SELECT') = 1
     AND count(*) FILTER (WHERE qual = 'true') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: quedan ' || count(*) FILTER (WHERE qual = 'true') || ' politicas abiertas'
  END                                                                   AS veredicto
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename = 'user_badges';
