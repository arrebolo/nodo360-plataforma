-- ============================================================================
-- 050: el contenido de un curso se sirve segun el estado del curso
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 24/09/2026.
--   Es DDL, asi que se ejecuto a mano en el SQL Editor de Supabase y se
--   versiona despues, como exige la regla 4 del prompt maestro.
--
--   Se ejecuto ENTERA Y DE UNA VEZ, la ultima de las tres: es la unica que no
--   depende del despliegue, porque ningun codigo de la aplicacion llama a
--   curso_visible() -- solo la invocan las politicas.
--
--   Escrita contra la salida de pg_policies del 24/09/2026, recogida mas abajo.
--   Verificado despues con node scripts/auditar-clave-anonima.mjs -> TODO
--   CORRECTO: lessons pasa de 87 a 69 filas para anon y modules de 29 a 23.
--
-- EL PROBLEMA
--   Con la clave anonima se leen las 87 lecciones y los 29 modulos de la base,
--   `content` incluido, sin importar si su curso esta publicado, archivado o en
--   borrador. `courses` si filtra (anon ve 10 de 13); `lessons` y `modules` no.
--
--   RLS esta ACTIVA en las dos tablas —un INSERT imposible responde 42501, que
--   solo emite una tabla con RLS— asi que lo que hay son politicas permisivas
--   de SELECT. pg_policies (24/09/2026) las nombra:
--
--     lessons  "Allow public read lessons"          USING true
--     lessons  "Enable read access for all users"   USING true   <- son DOS
--     modules  "Enable read access for all users"   USING true
--
--   Ninguna esta en el repo: las unicas politicas sobre estas tablas en
--   supabase/migrations y docs/migrations son las cuatro de la 014, todas para
--   instructores. Las de base se crearon desde el panel, como `is_admin` y como
--   las de `courses`. Por eso el bloque de limpieza recorre pg_policies en vez
--   de nombrarlas: dar por hecho que hay una sola habria dejado la otra.
--
--   Hoy el dano es acotado (todo el catalogo es gratuito y los 3 cursos no
--   publicados estuvieron publicados antes), pero fija el techo de lo que se
--   puede proteger: mientras siga asi, cualquier curso premium o en borrador
--   tendra su contenido accesible desde el primer dia.
--
-- POR QUE UNA FUNCION Y NO LA CONDICION REPETIDA EN CADA POLITICA
--   1. Las subconsultas de una politica aplican la RLS de las tablas que
--      consultan. Una politica sobre `lessons` que mire `courses` hereda lo que
--      `courses` oculte a ese rol: si `courses` no sirve los 'pending_review' a
--      un mentor, el mentor seguiria sin ver las lecciones aunque su excepcion
--      estuviera escrita. SECURITY DEFINER corta esa herencia.
--   2. La regla ya existe en TypeScript, en lib/courses/access.ts
--      (resolveCourseAccess), y es la unica que deciden hoy la ficha, la
--      leccion y el examen final. Esta funcion es su equivalente en SQL. Si se
--      escriben por separado, se separan para siempre.
--   3. La 024 dejo `quiz_questions` con una condicion propia mas estrecha
--      —solo 'published'—, y eso hace que **un mentor no pueda ver el quiz del
--      curso que se le pide revisar**. Unificar aqui lo arregla de paso.
--
-- QUE SE ROMPE
--   Hoy, nada. Solo hay 3 cursos no publicados, los 3 archivados, y los 3
--   tienen instructor_id = 34c7dd0a, que es ademas el unico admin: la politica
--   de instructores de la 014 ya le da acceso. Se comprobo antes de escribir
--   esto.
--
--   En cuanto haya un borrador de otro instructor o un curso en revision, esto
--   es lo que dependia de la politica permisiva y pasa a depender de la
--   funcion (todos con cliente de sesion, por eso les afecta):
--
--     - Panel de admin: admin/cursos/page.tsx, .../modulos/page.tsx,
--       .../modulos/[moduleId]/lecciones/*  -> cubierto por is_admin()
--     - components/courses/ModulesSortable.tsx (cliente de navegador, el
--       reordenar por arrastre)                -> cubierto por is_admin()
--     - dashboard/mentor/cursos/pendientes/[id] -> cubierto por la rama mentor
--     - dashboard/instructor/*                  -> ya cubierto por la 014
--
--   NO se ven afectados, comprobado uno a uno:
--     - /api/quiz/questions y /api/quiz/submit usan createAdminClient()
--       (service_role), como ya anoto la 024.
--     - /api/continue corta antes con if (course.status === 'archived').
--     - app/sitemap.ts ya filtra en JS por course.status === 'published':
--       misma salida, menos filas recibidas.
--     - Ninguna consulta sobre user_progress hace embed de lessons; todas
--       seleccionan escalares y cruzan en JS. Las 10 filas de progreso de 3
--       usuarios sobre lecciones que se ocultan se siguen leyendo igual.
--     - /verificar y /dashboard/certificados hacen module:modules(...), pero
--       los 16 certificados son type='course' y el codigo usa mod?.title.
--
-- COMPROBAR ANTES DE APLICAR
--   Que `courses` sirve los cursos no publicados a un admin autenticado. Si no
--   lo hiciera, el panel ya estaria roto hoy y seria un problema anterior y
--   distinto. La funcion no depende de ello (es SECURITY DEFINER), pero las
--   paginas que leen el curso ademas del contenido, si.
--
-- COMPROBACION PREVIA (clave anonima, 24/09/2026)
--   modules 29/29 · lessons 87/87 · quiz_questions denegada
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. La regla, en un solo sitio
-- ============================================================================
-- Equivalente en SQL de resolveCourseAccess:
--   publicado          -> cualquiera
--   no publicado       -> su instructor y el admin
--   en 'pending_review'-> ademas, cualquier mentor activo
--
-- SECURITY DEFINER para no heredar la RLS de courses ni de user_roles.
-- STABLE para que el planificador la llame una vez por curso y no por fila.
-- search_path fijo: sin el, un search_path manipulado podria resolver
-- `courses` a otra tabla dentro de una funcion que corre como su dueno.

CREATE OR REPLACE FUNCTION public.curso_visible(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.courses c
     WHERE c.id = p_course_id
       AND (
              c.status = 'published'
           OR (auth.uid() IS NOT NULL AND c.instructor_id = auth.uid())
           OR (auth.uid() IS NOT NULL AND is_admin(check_user_id => auth.uid()))
           OR (
                c.status = 'pending_review'
                AND EXISTS (
                  SELECT 1 FROM public.user_roles ur
                   WHERE ur.user_id = auth.uid()
                     AND ur.role = 'mentor'
                     AND ur.is_active
                )
              )
           )
  );
$$;

COMMENT ON FUNCTION public.curso_visible IS
  'Quien puede ver el contenido de un curso. Equivalente en SQL de resolveCourseAccess (lib/courses/access.ts). SECURITY DEFINER para no heredar la RLS de courses en las politicas que la invocan.';

REVOKE ALL ON FUNCTION public.curso_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.curso_visible(uuid) TO anon, authenticated, service_role;

-- ============================================================================
-- 2. Retirar las politicas permisivas de SELECT
-- ============================================================================
-- Quita TODAS las politicas de SELECT de las tres tablas —son tres, dos de
-- ellas sobre lessons— y deja que las de abajo las sustituyan. Las de
-- INSERT/UPDATE/DELETE de la 014 no se tocan.
--
-- pg_policies no muestra ninguna politica FOR ALL sobre estas tres tablas, asi
-- que recorrer cmd = 'SELECT' las cubre todas. El bucle avisa por NOTICE de
-- cual retira: conviene mirar la salida y que sean exactamente esas tres mas
-- la de quiz_questions de la 024.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('lessons', 'modules', 'quiz_questions')
       AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    RAISE NOTICE 'retirada politica SELECT %.%', r.tablename, r.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- 3. Una sola regla de lectura por tabla
-- ============================================================================

CREATE POLICY "Lecciones segun visibilidad del curso"
ON public.lessons FOR SELECT TO anon, authenticated
USING (curso_visible(lessons.course_id));

CREATE POLICY "Modulos segun visibilidad del curso"
ON public.modules FOR SELECT TO anon, authenticated
USING (curso_visible(modules.course_id));

-- quiz_questions no tiene course_id: se resuelve por su modulo. Se mantiene
-- fuera de anon, como la dejo la 024, porque las respuestas correctas no tienen
-- por que salir de la plataforma ni para un curso publicado.
CREATE POLICY "Preguntas segun visibilidad del curso"
ON public.quiz_questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
     WHERE m.id = quiz_questions.module_id
       AND curso_visible(m.course_id)
  )
);

-- ============================================================================
-- 4. Indices que estas politicas dan por supuestos
-- ============================================================================
-- La politica se evalua por fila. Con 87 lecciones da igual; con 8.700 no.

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules (course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_module_id ON public.quiz_questions (module_id);

COMMIT;


-- ============================================================================
-- COMPROBACIONES
-- ============================================================================
-- 1. Con la clave ANONIMA, solo el contenido de cursos publicados:
--
--      GET /rest/v1/lessons?select=id   -> 69 filas (eran 87)
--      GET /rest/v1/modules?select=id   -> 23 filas (eran 29)
--      GET /rest/v1/quiz_questions?select=id -> 42501, como antes
--
--    Las 18 lecciones y 6 modulos que desaparecen son los de los 3 cursos
--    archivados: custodia-y-proteccion-de-tus-fondos,
--    custodia-y-proteccion-practica-de-criptomonedas y
--    bitcoin-como-sistema-monetario.
--
-- 2. La funcion responde lo esperado sin sesion (auth.uid() nulo):
--
--      SELECT c.slug, c.status, public.curso_visible(c.id)
--        FROM public.courses c ORDER BY c.status, c.slug;
--      QUE DEBE SALIR: true en los 10 published, false en los 3 archived.
--
-- 3. Ninguna pagina publica cambia: /cursos, /cursos/[slug],
--    /cursos/[slug]/[leccion], /rutas y /rutas/[slug] se abren sin sesion y
--    muestran lo mismo.
--
-- 4. El panel de admin sigue entrando en los 3 cursos archivados, y el
--    reordenar por arrastre de modulos sigue funcionando.
--
-- 5. Cuando haya un curso en 'pending_review', un mentor activo debe ver sus
--    modulos, sus lecciones Y su quiz. Es lo que la 024 no permitia.
