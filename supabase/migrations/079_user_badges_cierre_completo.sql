-- ============================================================================
-- 079: user_badges, cierre completo. La 077 no bastó
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/079-aplicar.sql
--
-- QUÉ PASÓ CON LA 077
--   Se aplicó el 28/09/2026 y su propia verificación dijo que no había
--   terminado:
--
--       politicas_select 4   ·   abiertas 2   ·   veredicto REVISAR
--
--   Comprobado después con la clave anónima, ya aplicada la 077:
--
--       select user_id, badge_id, unlocked_at from user_badges  ->  29 filas
--
--   La fuga sigue abierta. La 077 hacía DROP POLICY de UNA política POR SU
--   NOMBRE -"Users can view all badges for display", la que creó la 004- y esa
--   no es la única abierta. La base tiene 4 políticas de SELECT sobre esta
--   tabla y el repositorio solo documenta 2: al menos dos se crearon a mano en
--   el editor y nunca se versionaron. Sus nombres NO están en el repositorio,
--   así que no se pueden borrar por nombre desde aquí.
--
--   Lección, y es la de siempre: una política se retira por lo que HACE, no por
--   cómo se llama. Este fichero recorre pg_policies y retira todas las de
--   SELECT, cualesquiera que sean sus nombres, y los deja escritos en un NOTICE
--   para que quede constancia de qué había.
--
-- POR QUÉ IMPORTA
--   Las políticas de PostgreSQL se combinan con OR, no con AND. Una sola
--   USING (true) concede todo lo que restringen las demás: mientras quede una,
--   las otras tres no sirven para nada.
--
--   Los 29 user_id no identifican a nadie por sí solos -son UUID y public.users
--   está cerrada desde la 049- pero permiten enumerar cuántas cuentas hay, qué
--   ha conseguido cada una y cuándo. No cuesta nada cerrarlo y no hay ninguna
--   razón para servirlo.
--
-- HALLAZGO NUEVO: anon también tiene UPDATE y DELETE
--   Sondeado sin escribir nada, con la clave anónima:
--
--       INSERT  ->  42501, lo para la RLS
--       UPDATE  ->  permitido por el GRANT, 0 filas (lo filtra la RLS)
--       DELETE  ->  permitido por el GRANT, 0 filas (lo filtra la RLS)
--
--   Que el INSERT lo pare la RLS demuestra, de paso, que NINGUNA de las
--   políticas abiertas es de tipo ALL: si lo fuera, su USING (true) habría
--   servido de WITH CHECK y el INSERT habría pasado. Las dos abiertas son de
--   SELECT, que es justo lo que este fichero retira.
--
--   Hoy no se pierde nada porque la RLS filtra, pero el GRANT sobra: anon no
--   tiene por qué poder ni intentarlo. Se retira, junto con el de SELECT. Eso
--   deja la tabla cerrada a la clave anónima por dos vías independientes -sin
--   GRANT y sin política-, de modo que una política abierta creada a mano
--   mañana no volvería a abrirla.
--
-- POR QUÉ LAS POLÍTICAS VAN «TO authenticated»
--   La política del admin llama a public.es_admin_actual(), y la 034 le quitó
--   el EXECUTE a anon a propósito. Comprobado:
--
--       es_admin_actual() como service_role  ->  false
--       es_admin_actual() como anon          ->  42501 permission denied
--
--   Si la política se escribiera para todos los roles, una petición anónima
--   tendría que evaluarla -auth.uid() es NULL, así que «auth.uid() = user_id»
--   da NULL, no false, y el OR obliga a evaluar el otro lado- y contestaría con
--   un error 42501 en lugar de con una lista vacía. Con TO authenticated, anon
--   no encaja en ninguna política, ve cero filas y nunca llega a llamarla.
--
-- QUÉ NECESITA SEGUIR LEYENDO, Y SIGUE LEYENDO
--   Inventario completo, con grep sobre app/, lib/ y components/:
--
--     app/(private)/dashboard/badges            propias   (además usa admin)
--     app/(private)/dashboard/progreso          propias
--     app/api/gamification/stats                propias, 401 sin sesión
--     app/api/governance/proposals/[id]/vote    propias, 401 sin sesión
--     app/(private)/admin/gamificacion          TODAS, agregadas
--     app/(private)/admin/gamificacion/hitos    TODAS, agregadas
--     lib/admin/queries.ts                      TODAS, agregadas
--     lib/gamification/checkAndAwardBadges.ts   escribe con service_role
--
--   Las tres de administración cuentan insignias de TODO EL MUNDO -cuántas hay
--   desbloqueadas, cuáles son las más populares, cuántas hoy- y lo hacen con el
--   cliente de sesión, no con el de servicio. Una política «auth.uid() =
--   user_id» a secas no habría dado ningún error: habría dejado los contadores
--   del panel a las insignias del propio admin, en silencio. De ahí la segunda
--   política.
--
--   checkAndAwardBadges usa createAdminClient(), es decir service_role, que se
--   salta la RLS entera: conceder insignias no depende de nada de esto.
--
--   Ninguna página pública lee esta tabla. /instructores/[id] y /mentores/[id]
--   no la mencionan ni una vez.
--
-- EL BORRADO DEL PANEL NO NECESITA POLÍTICA
--   /api/admin/badges/[id] borra los user_badges de un hito antes de borrar el
--   hito, con el cliente de sesión. No hace falta política: la clave ajena es
--   `badge_id ... ON DELETE CASCADE` desde la 004, así que borrar el hito se
--   lleva sus filas igual. Ese borrado previo es redundante.
--
-- SI ALGÚN DÍA HAY PERFILES PÚBLICOS CON INSIGNIAS
--   No se vuelve a USING (true). Se hace como la 049 con users: una función
--   SECURITY DEFINER que devuelva las insignias de UN usuario concreto y solo
--   las columnas que se pinten. Una política abierta no distingue entre
--   «enseñar el perfil de Ana» y «descargar la tabla entera».
--
-- REVERSIÓN
--   GRANT SELECT ON public.user_badges TO anon;
--   CREATE POLICY "Users can view all badges for display"
--     ON public.user_badges FOR SELECT USING (true);
--
-- REEJECUTABLE: retira lo que haya y deja siempre el mismo estado final.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. La RLS, encendida. Ya lo estaba desde la 004; es una red, no un cambio.
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- 2. Fuera TODAS las políticas de SELECT, se llamen como se llamen
-- ----------------------------------------------------------------------------
-- Dos de las cuatro nunca se versionaron, así que no hay nombre que poner en un
-- DROP. Se recorren y se retiran por lo que son. Los nombres y su USING quedan
-- en un NOTICE: es la única forma de saber qué había, y con eso se pueden
-- versionar a posteriori si alguna vez hace falta explicarlas.
DO $do$
DECLARE
  p           RECORD;
  v_retiradas TEXT[] := '{}';
BEGIN
  FOR p IN
    SELECT policyname, qual
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'user_badges'
       AND cmd        = 'SELECT'
     ORDER BY policyname
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_badges', p.policyname);
    v_retiradas := v_retiradas
                || (p.policyname::text || '  USING ' || coalesce(p.qual, '(sin USING)'));
  END LOOP;

  RAISE NOTICE 'politicas de SELECT retiradas: %', coalesce(array_length(v_retiradas, 1), 0);
  IF array_length(v_retiradas, 1) > 0 THEN
    RAISE NOTICE '  %', array_to_string(v_retiradas, E'\n  ');
  END IF;
END
$do$;


-- ----------------------------------------------------------------------------
-- 3. El estado final, escrito entero: dos políticas y ninguna más
-- ----------------------------------------------------------------------------
CREATE POLICY "Cada persona ve sus insignias"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- El panel de administración cuenta insignias de todo el mundo. Sin esto, sus
-- contadores se quedarían en las del propio admin sin dar ningún error.
CREATE POLICY "Un admin ve las insignias de todos"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (public.es_admin_actual());


-- ----------------------------------------------------------------------------
-- 4. Y a la clave anónima se le retira el permiso, no solo el paso
-- ----------------------------------------------------------------------------
-- Ninguna página pública lee esta tabla, y quien la escribe lo hace con
-- service_role. REVOKE de un permiso que no se tiene no da error, así que esto
-- es reejecutable.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.user_badges FROM anon;


COMMENT ON TABLE public.user_badges IS
  'Insignias conseguidas por cada persona. SELECT restringido a la fila propia, mas los administradores para los contadores del panel (079, 28/09/2026). Hasta la 079 habia cuatro politicas de SELECT y dos abiertas con USING (true): la tabla entera, con user_id, se servia a la clave anonima. anon ya no tiene ningun GRANT aqui. Para ensenar insignias ajenas en un perfil publico, funcion SECURITY DEFINER que devuelva las de UN usuario, nunca una politica abierta.';


-- ----------------------------------------------------------------------------
-- 5. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     politicas_select  -> 2
--     abiertas          -> 0
--     politicas         -> Cada persona ve sus insignias (SELECT, authenticated)
--                          | Un admin ve las insignias de todos (SELECT, authenticated)
--     anon_puede_leer   -> false
--     filas             -> 29        no se borra nada
--     veredicto         -> TODO CORRECTO
--
-- En la pestaña de mensajes quedan además los nombres de las políticas que se
-- han retirado, incluidas las dos que nunca se versionaron. Conviene copiarlos.
--
-- Y DESPUÉS, fuera del editor, la prueba que de verdad importa:
--     node tmp/comprobar-user-badges.mjs
--   Tiene que decir 0 filas con la clave anónima.
SELECT
  count(*) FILTER (WHERE cmd = 'SELECT')                              AS politicas_select,
  count(*) FILTER (WHERE qual = 'true')                               AS abiertas,
  string_agg(
    policyname::text || ' (' || cmd || ', ' || array_to_string(roles, '+') || ')',
    ' | ' ORDER BY policyname)                                        AS politicas,
  has_table_privilege('anon', 'public.user_badges', 'SELECT')          AS anon_puede_leer,
  (SELECT count(*) FROM public.user_badges)                            AS filas,
  CASE
    WHEN count(*) FILTER (WHERE cmd = 'SELECT') = 2
     AND count(*) FILTER (WHERE qual = 'true')  = 0
     AND NOT has_table_privilege('anon', 'public.user_badges', 'SELECT')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: '
      || count(*) FILTER (WHERE cmd = 'SELECT') || ' politicas de SELECT, '
      || count(*) FILTER (WHERE qual = 'true')  || ' abiertas, anon lee: '
      || has_table_privilege('anon', 'public.user_badges', 'SELECT')
  END                                                                  AS veredicto
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'user_badges';
