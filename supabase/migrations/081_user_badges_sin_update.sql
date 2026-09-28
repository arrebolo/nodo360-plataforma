-- ============================================================================
-- 081: user_badges deja de poder modificarse desde una sesión
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/081-aplicar.sql
--
-- QUÉ SE RETIRA
--   La política "Users can update own badge features" (UPDATE, rol public).
--   No está en el repositorio: es una de las creadas a mano en el editor. La
--   encontró la verificación de la 079 y la 080 leyó lo que comprueba:
--
--       USING       (auth.uid() = user_id)
--       WITH CHECK  (auth.uid() = user_id)
--
-- POR QUÉ SE RETIRA, SI EL FILTRO PARECE CORRECTO
--   El filtro está bien en lo que mira y le falta lo que no mira. Comprueba
--   QUIÉN es el dueño de la fila, y NADA MÁS. Consecuencias:
--
--     · Insignias ajenas: NO se pueden tocar. El USING lo impide.
--     · Insignias nuevas: NO se pueden crear. Un UPDATE no crea filas.
--     · Pero el WITH CHECK no dice nada sobre las COLUMNAS, así que quien
--       tenga una insignia cualquiera puede cambiarle el `badge_id` por el de
--       otra que no ha ganado, y ponerle la `unlocked_at` que quiera.
--
--   No es concederse una insignia nueva: es CANJEAR la que tiene por otra. El
--   UNIQUE(user_id, badge_id) solo impide duplicar una que ya se tenga.
--
--   Una política que autoriza a modificar `is_featured` autoriza en realidad a
--   modificar la fila entera, porque no hay forma de limitar una política de
--   UPDATE a una columna: eso se hace con el GRANT, no con la política.
--
-- Y SOBRE TODO: NO HAY NADA QUE PROTEGER
--   `is_featured` NO se lee ni se escribe en ninguna parte del código.
--   Comprobado con grep sobre app/, lib/ y components/: solo aparece en
--   lib/supabase/types.ts, que es un fichero generado a partir del esquema.
--   Ningún sitio hace UPDATE sobre user_badges, con ninguna clave.
--
--   Así que la política habilita un canje de insignias para sostener una
--   función que no existe. Se retira. Si algún día se construyen las insignias
--   destacadas, hace falta MÁS que volver a crearla: ver el final.
--
-- QUÉ NO TOCA
--   · La columna `is_featured` SE QUEDA. No se borra ni se cambia: la
--     verificación final lo comprueba expresamente.
--   · Las dos políticas de SELECT de la 079, intactas.
--   · Ni una fila. Las 29 insignias concedidas siguen donde están.
--   · Conceder insignias no se entera: checkAndAwardBadges usa
--     createAdminClient(), es decir service_role, que se salta la RLS entera.
--   · El borrado del panel de administración tampoco: /api/admin/badges/[id]
--     borra el hito y `badge_id ... ON DELETE CASCADE` se lleva sus filas.
--
-- EL GRANT, ADEMÁS DE LA POLÍTICA
--   Sin políticas de UPDATE, la RLS ya deniega cualquier UPDATE de un usuario
--   con sesión. Pero el GRANT de UPDATE sobre la tabla sigue concedido a
--   `authenticated`, y un permiso sin política es un cable pelado: el día que
--   alguien añada una política de UPDATE «para probar algo», el canje de
--   insignias vuelve a estar abierto sin que nadie lo note.
--
--   Se retira también. Igual que la 079 hizo con anon: dos vías
--   independientes, sin GRANT y sin política.
--
-- SI ALGÚN DÍA HAY INSIGNIAS DESTACADAS
--   No se vuelve a una política de UPDATE sobre la tabla entera. Dos opciones,
--   las dos correctas:
--
--     a) GRANT UPDATE (is_featured) ON public.user_badges TO authenticated,
--        con la política de dueño. El GRANT por columna es lo que impide tocar
--        badge_id; la política sola no puede.
--     b) Una función SECURITY DEFINER que reciba el badge_id y ponga
--        is_featured en la fila de auth.uid(), y nada más.
--
-- REVERSIÓN
--   GRANT UPDATE ON public.user_badges TO authenticated;
--   CREATE POLICY "Users can update own badge features"
--     ON public.user_badges FOR UPDATE
--     USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
--
-- REEJECUTABLE: retira lo que haya y deja siempre el mismo estado final.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Fuera TODAS las políticas de UPDATE, se llamen como se llamen
-- ----------------------------------------------------------------------------
-- El nombre se conoce, pero se retiran por lo que son y no por cómo se llaman:
-- es la lección de la 077, que hizo DROP por nombre y dejó dos abiertas que no
-- estaban en el repositorio. Los nombres quedan en un NOTICE.
DO $do$
DECLARE
  p           RECORD;
  v_retiradas TEXT[] := '{}';
BEGIN
  FOR p IN
    SELECT policyname, qual, with_check
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'user_badges'
       AND cmd        = 'UPDATE'
     ORDER BY policyname
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_badges', p.policyname);
    v_retiradas := v_retiradas
                || (p.policyname::text
                    || '  USING ' || coalesce(p.qual, '(ninguno)')
                    || '  WITH CHECK ' || coalesce(p.with_check, '(ninguno)'));
  END LOOP;

  RAISE NOTICE 'politicas de UPDATE retiradas: %', coalesce(array_length(v_retiradas, 1), 0);
  IF array_length(v_retiradas, 1) > 0 THEN
    RAISE NOTICE '  %', array_to_string(v_retiradas, E'\n  ');
  END IF;
END
$do$;


-- ----------------------------------------------------------------------------
-- 2. Y el permiso, que sin política ya no servía de nada
-- ----------------------------------------------------------------------------
-- REVOKE de un permiso que no se tiene no da error: esto es reejecutable.
-- No afecta a service_role, que es quien concede las insignias.
REVOKE UPDATE ON public.user_badges FROM authenticated;


COMMENT ON TABLE public.user_badges IS 'Insignias conseguidas por cada persona. SELECT restringido a la fila propia, mas los administradores para los contadores del panel (079, 28/09/2026). Sin politicas de UPDATE ni GRANT de UPDATE desde la 081: la que habia comprobaba solo el dueno de la fila, asi que permitia canjear el badge_id de una insignia propia por el de otra no ganada. Solo service_role escribe aqui. La columna is_featured se conserva, pero no la usa ningun codigo: para insignias destacadas, GRANT UPDATE (is_featured) o una funcion SECURITY DEFINER, nunca una politica de UPDATE sobre la tabla entera.';


-- ----------------------------------------------------------------------------
-- 3. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     politicas_total        -> 2      solo las dos de SELECT de la 079
--     politicas_update       -> 0
--     politicas_select       -> 2
--     auth_puede_update      -> false  se ha retirado el GRANT
--     anon_puede_leer        -> false  sigue cerrado desde la 079
--     is_featured_sigue_ahi  -> true   la columna NO se ha tocado
--     filas                  -> 29     no se borra nada
--     veredicto              -> TODO CORRECTO
SELECT
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges')          AS politicas_total,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges'
      AND cmd = 'UPDATE')                                              AS politicas_update,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges'
      AND cmd = 'SELECT')                                              AS politicas_select,

  has_table_privilege('authenticated', 'public.user_badges', 'UPDATE')  AS auth_puede_update,
  has_table_privilege('anon', 'public.user_badges', 'SELECT')           AS anon_puede_leer,

  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'user_badges'
             AND column_name = 'is_featured')                           AS is_featured_sigue_ahi,

  (SELECT count(*) FROM public.user_badges)                             AS filas,

  CASE
    WHEN (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'user_badges'
             AND cmd = 'UPDATE') = 0
     AND (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'user_badges'
             AND cmd = 'SELECT') = 2
     AND NOT has_table_privilege('authenticated', 'public.user_badges', 'UPDATE')
     AND NOT has_table_privilege('anon', 'public.user_badges', 'SELECT')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'user_badges'
                    AND column_name = 'is_featured')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                   AS veredicto;
