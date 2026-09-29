-- ============================================================================
-- MIGRACION 088: el control de publicacion deja de vivir solo en la aplicacion
--
-- LOS TRES AGUJEROS, MEDIDOS EL 29/09/2026
-- Con una cuenta de prueba y el cliente de sesion, hablando con PostgREST
-- directamente, sin pasar por ninguna ruta de la API:
--
--   1. un STUDENT insertaba una fila en public.courses            PUDO
--   1b. un INSTRUCTOR creaba el curso ya con un status de solo
--       administracion                                            PUDO
--   2. un INSTRUCTOR ponia en SU curso un status de solo
--       administracion                                            PUDO
--   3. un INSTRUCTOR se autoaprobaba (review_status='approved')    PUDO
--
-- Y lo que debia seguir funcionando, funcionaba: enviar su curso a revision y
-- editar su titulo.
--
-- No se probo nunca status='published', a proposito: habria dejado un curso de
-- prueba visible en el catalogo, aunque fuese un segundo. Se uso 'rejected',
-- que es igual de «solo administracion» (ADMIN_ONLY_STATUSES de
-- app/api/instructor/courses/[id]/status/route.ts) y no sale a ninguna parte.
-- Misma columna y misma politica: el privilegio que demuestra es el mismo.
--
-- POR QUE NO BASTABA LA APLICACION
-- La ruta de status SI comprueba el rol, y bien: «Solo admin puede cambiar a
-- published o rejected». El problema es que la ruta no es la unica puerta. La
-- clave anonima es publica, PostgREST es alcanzable, y las acciones de servidor
-- exportadas de lib/courses/course-actions.ts son endpoints HTTP publicos que
-- no comprobaban nada y aceptaban del formulario tanto `instructor_id` como
-- `status`. Mismo patron que el banco de preguntas de la 087.
--
-- POR QUE UN TRIGGER Y NO UNA POLITICA PARA LOS PUNTOS 2 Y 3
-- Una politica de UPDATE no puede comparar la fila vieja con la nueva: USING ve
-- la vieja y WITH CHECK la nueva, y no hay forma de relacionarlas. Se podria
-- escribir WITH CHECK (status <> 'published'), pero entonces un instructor no
-- podria ni corregir una falta de ortografia en un curso ya publicado: el
-- resultado seguiria siendo 'published' y la politica lo rechazaria.
--
-- Una transicion es una regla sobre el par (viejo, nuevo), y eso en PostgreSQL
-- se escribe en un trigger. Ademas un trigger BEFORE no lo esquiva ningun
-- cliente: ni el de sesion, ni PostgREST, ni service_role.
--
-- LA EXENCION, Y LA OBJECION DE LA 030
-- El trigger deja pasar dos casos: sin identidad (auth.uid() IS NULL, que es
-- service_role, el editor SQL y las migraciones) y administracion.
--
-- La 030 argumento contra usar «sin JWT» como exencion, y el argumento sigue
-- siendo bueno: el dia que alguien convierta una ruta de instructor a
-- createAdminClient para esquivar una politica, la comprobacion se caeria en
-- silencio. Aqui se acepta porque el control compensatorio esta en el mismo PR
-- y no en la buena memoria de nadie: la accion de servidor que podia crear y
-- actualizar cursos sin comprobar nada ahora comprueba el rol ella misma, y
-- deja de aceptar `status` y `instructor_id` de quien la llama.
--
-- LO QUE ESTA MIGRACION NO HACE
-- No toca los privilegios de columna de public.courses. Si `authenticated`
-- tiene UPDATE a nivel de tabla, un REVOKE de una sola columna no hace nada
-- (esa fue la leccion de la 084 y la 085), y repartir los privilegios columna a
-- columna en courses es una operacion grande y con riesgo propio. El REVOKE de
-- review_status va incluido porque es inofensivo, y la verificacion final dice
-- si ha tenido efecto o no. Mientras no lo tenga, quien sostiene los puntos 2 y
-- 3 es el trigger, que no se puede esquivar.
--
-- No cambia ninguna politica de SELECT, UPDATE ni DELETE de courses: las de
-- UPDATE y DELETE ya protegian los cursos de otros (comprobado), y tocarlas
-- seria arriesgar el flujo de revision sin necesidad.
--
-- NO BORRA NI UNA FILA.
-- Es reejecutable.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Quien puede crear cursos
-- =====================================================
-- SECURITY DEFINER para no depender de que quien llama pueda leer users.role:
-- la 049 dejo esa columna legible, pero la politica no debe romperse el dia que
-- eso cambie. Y evita que la politica de courses arrastre las politicas de
-- users en cada INSERT.

CREATE OR REPLACE FUNCTION public.puede_crear_cursos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = auth.uid()
       AND u.role IN ('instructor', 'mentor', 'admin')
  );
$$;

COMMENT ON FUNCTION public.puede_crear_cursos() IS
  'Cierto si la sesion actual es instructor, mentor o admin. La usa la politica de INSERT de courses: antes de la 088 un student podia insertar una fila.';

REVOKE ALL ON FUNCTION public.puede_crear_cursos() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.puede_crear_cursos() FROM anon;
GRANT EXECUTE ON FUNCTION public.puede_crear_cursos() TO authenticated;

-- =====================================================
-- 2. La politica de INSERT de courses
-- =====================================================
-- Se retiran TODAS las de INSERT recorriendo el catalogo, sin fiarse de los
-- nombres: la que dejaba entrar a un student no esta versionada en ninguna
-- migracion, asi que su nombre no se puede escribir aqui.

DO $do$
DECLARE
  p record;
  n int := 0;
BEGIN
  FOR p IN
    SELECT policyname, with_check
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'INSERT'
  LOOP
    RAISE NOTICE 'Retirando politica INSERT de courses: % · WITH CHECK %', p.policyname, coalesce(p.with_check, '(ninguno)');
    EXECUTE format('DROP POLICY %I ON public.courses', p.policyname);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'Politicas de INSERT retiradas: %', n;

  -- Una politica FOR ALL tambien autoriza INSERT, y no se toca aqui porque
  -- retirarla se llevaria por delante su SELECT, UPDATE y DELETE. Si aparece
  -- alguna, la verificacion final la cuenta y hay que mirarla aparte.
  FOR p IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'ALL'
  LOOP
    RAISE WARNING 'OJO: politica FOR ALL en courses, tambien autoriza INSERT: %', p.policyname;
  END LOOP;
END
$do$;

CREATE POLICY "Solo instructores y administracion crean cursos"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.es_admin_actual()
    OR (instructor_id = auth.uid() AND public.puede_crear_cursos())
  );

-- =====================================================
-- 3. El trigger que gobierna status y review_status
-- =====================================================

CREATE OR REPLACE FUNCTION public.controlar_publicacion_de_cursos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  SOLO_ADMIN constant text[] := ARRAY['published', 'rejected'];
BEGIN
  -- Sin identidad en la sesion: service_role, el editor SQL y las migraciones.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  -- De aqui abajo: alguien con sesion que no es administracion.

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION
        'Un curso nuevo solo puede nacer en borrador; se intento "%". Publicar o rechazar lo decide la administracion.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = ANY (SOLO_ADMIN) THEN
      RAISE EXCEPTION
        'Solo la administracion puede dejar un curso en "%". Para pedir la publicacion, enviar a revision.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status = 'pending_review' AND NEW.status <> 'draft' THEN
      RAISE EXCEPTION
        'El curso esta pendiente de revision: desde ahi solo puede volver a borrador.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    RAISE EXCEPTION
      'review_status lo decide quien revisa, no quien escribe el curso.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.controlar_publicacion_de_cursos() IS
  'Gobierna courses.status y courses.review_status. Antes de la 088 un instructor podia publicarse y autoaprobarse escribiendo directamente en PostgREST. Es un trigger y no una politica porque una transicion es una regla sobre (viejo, nuevo), y una politica RLS no puede comparar las dos filas.';

DROP TRIGGER IF EXISTS trg_controlar_publicacion ON public.courses;

CREATE TRIGGER trg_controlar_publicacion
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.controlar_publicacion_de_cursos();

-- =====================================================
-- 4. review_status, fuera del alcance de authenticated
-- =====================================================
-- Segunda cerradura, independiente del trigger. Solo tiene efecto si los
-- privilegios de courses son de columna; con un GRANT de tabla no hace nada, y
-- la verificacion final lo dice. Nada en la aplicacion lee ni escribe esta
-- columna: se busco en app, lib y components y no aparece una sola vez.

REVOKE INSERT (review_status), UPDATE (review_status) ON public.courses FROM authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'INSERT')   AS politicas_insert,

  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'ALL')      AS politicas_for_all,

  EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgrelid = 'public.courses'::regclass
       AND tgname = 'trg_controlar_publicacion'
       AND NOT tgisinternal
  )                                                                            AS trigger_activo,

  to_regprocedure('public.puede_crear_cursos()') IS NOT NULL                    AS funcion_creada,

  has_column_privilege('authenticated', 'public.courses', 'review_status', 'UPDATE')
                                                                               AS auth_escribe_review_status,

  has_table_privilege('authenticated', 'public.courses', 'UPDATE')              AS auth_update_de_tabla,

  (SELECT count(*) FROM public.courses)                                         AS cursos,
  (SELECT count(*) FROM public.courses WHERE status = 'published')              AS publicados,

  CASE
    WHEN (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'INSERT') = 1
     AND (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'ALL') = 0
     AND EXISTS (
       SELECT 1 FROM pg_trigger
        WHERE tgrelid = 'public.courses'::regclass
          AND tgname = 'trg_controlar_publicacion'
          AND NOT tgisinternal)
     AND to_regprocedure('public.puede_crear_cursos()') IS NOT NULL
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                          AS veredicto;
