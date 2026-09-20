-- ============================================
-- MIGRATION 021: RLS y proteccion de respuestas de quiz
-- Fecha: 20 Septiembre 2026
-- Estado: *** NO APLICADA - PENDIENTE DE REVISION ***
-- ============================================
--
-- Incorpora la migracion 018 rescatada (rama feature/lesson-comments, nunca
-- mergeada) y anade la proteccion de quiz_questions.correct_answer.
--
-- CONTEXTO (verificado contra la base de datos el 20/09/2026):
--
--   quiz_questions ....... 91 filas, TODAS legibles por un cliente ANONIMO,
--                          incluyendo la columna correct_answer.
--   quiz_attempts ........ RLS aplicandose correctamente (anon ve 0 de 11).
--   user_lesson_notes .... RLS aplicandose correctamente (anon ve 0 de 2).
--   users ................ expone 3 de 23 (mentor/admin/instructor): perfiles
--                          publicos, comportamiento aparentemente intencional.
--   course_final_quiz_attempts ... 0 filas: NO se pudo determinar su estado de
--                          RLS por sondeo. Ejecutar VERIFICACION 1 (abajo)
--                          antes de decidir si la PARTE 1 hace falta.
--
-- ORDEN DE APLICACION RECOMENDADO:
--   1. PARTE 1 y PARTE 2A -> seguras, no rompen nada. Aplicar ya.
--   2. Cambios de codigo  -> ver RESUMEN-CAMBIOS-CODIGO.md en esta misma rama.
--   3. PARTE 2B           -> SOLO despues de desplegar los cambios de codigo.
--                            Si se aplica antes, ROMPE la pagina del quiz final.
--
-- ============================================


-- ============================================
-- PARTE 1 - course_final_quiz_attempts
-- (contenido integro de la migracion 018 rescatada)
-- ============================================

ALTER TABLE public.course_final_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Usuarios: solo ven sus propios intentos
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can view own quiz attempts"
ON public.course_final_quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Usuarios: solo insertan intentos propios
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts"
ON public.course_final_quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuarios: solo actualizan intentos propios
DROP POLICY IF EXISTS "Users can update own quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can update own quiz attempts"
ON public.course_final_quiz_attempts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins: acceso total
-- NOTA: is_admin() existe en la BD con el parametro nombrado 'check_user_id'.
-- Esta llamada es posicional, por lo que funciona. No renombrar el parametro ni
-- usar CREATE OR REPLACE con otro nombre: Postgres lo rechaza (ver el incidente
-- de la migracion 020_message_moderation_flags.sql).
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Admins can view all quiz attempts"
ON public.course_final_quiz_attempts
FOR ALL
USING (is_admin(auth.uid()));


-- ============================================
-- PARTE 2A - quiz_questions: cerrar el acceso anonimo
-- SEGURA: no rompe nada del codigo actual.
-- ============================================
--
-- Las rutas /api/quiz/* usan createAdminClient() (service_role), que IGNORA RLS
-- por diseno. Por eso esta parte no las afecta: solo corta el acceso directo via
-- PostgREST con la clave anonima, que es el agujero detectado.
--
-- IMPORTANTE: esta parte NO impide que correct_answer llegue al navegador a
-- traves de la API. Para eso hacen falta los cambios de codigo + la PARTE 2B.

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Anonimos: sin acceso (al activar RLS sin politica para anon, queda cerrado).

-- Autenticados: leen preguntas de modulos de cursos publicados.
DROP POLICY IF EXISTS "Authenticated can read questions of published courses" ON public.quiz_questions;
CREATE POLICY "Authenticated can read questions of published courses"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = quiz_questions.module_id
      AND c.status = 'published'
  )
);

-- Admins: acceso total (alta/edicion desde el panel).
DROP POLICY IF EXISTS "Admins manage questions" ON public.quiz_questions;
CREATE POLICY "Admins manage questions"
ON public.quiz_questions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));


-- ============================================
-- PARTE 2B - que correct_answer NO salga nunca al cliente
-- *** NO APLICAR HASTA HABER DESPLEGADO LOS CAMBIOS DE CODIGO ***
-- ============================================
--
-- RLS protege FILAS, no COLUMNAS. Aunque la PARTE 2A cierre el acceso anonimo,
-- un usuario autenticado seguiria viendo correct_answer. El unico modo de
-- garantizar que la columna no sale es revocar el privilegio a nivel de columna.
--
-- EFECTO SECUNDARIO QUE HAY QUE ASUMIR:
--   Tras el REVOKE, cualquier select('*') sobre quiz_questions hecho con la
--   clave de usuario (anon/authenticated) FALLA con "permission denied for
--   column correct_answer". Hoy hay al menos un sitio asi:
--
--     app/cursos/[slug]/quiz-final/page.tsx:63   .select('*')
--
--   Debe pasar a lista explicita de columnas ANTES de ejecutar esto.
--   (Las rutas /api/quiz/* no se ven afectadas: usan service_role.)

-- REVOKE SELECT (correct_answer) ON public.quiz_questions FROM anon;
-- REVOKE SELECT (correct_answer) ON public.quiz_questions FROM authenticated;

-- Vista sin la respuesta, para que el cliente consuma las preguntas sin riesgo.
-- security_invoker = on -> la vista respeta las politicas RLS de quien consulta.
CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker = on) AS
SELECT
  id,
  module_id,
  question,
  options,
  order_index,
  difficulty,
  points
  -- correct_answer: OMITIDA A PROPOSITO
  -- explanation:    OMITIDA (su texto puede revelar la respuesta)
FROM public.quiz_questions;

COMMENT ON VIEW public.quiz_questions_public IS
  'Preguntas de quiz sin correct_answer ni explanation. Unica via por la que el
   cliente debe leer preguntas. La correccion se hace server-side en
   /api/quiz/submit.';

GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;


-- ============================================
-- VERIFICACION (ejecutar ANTES y DESPUES, solo lectura)
-- ============================================

-- VERIFICACION 1 - estado de RLS y numero de politicas
-- select c.relname as tabla,
--        c.relrowsecurity as rls_activo,
--        (select count(*) from pg_policies p
--          where p.tablename = c.relname and p.schemaname = 'public') as num_politicas
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname in ('course_final_quiz_attempts','quiz_questions',
--                     'quiz_attempts','users','user_lesson_notes')
-- order by c.relname;

-- VERIFICACION 2 - privilegios de columna sobre correct_answer
-- (tras la PARTE 2B no debe devolver filas para anon ni authenticated)
-- select grantee, privilege_type
-- from information_schema.column_privileges
-- where table_schema = 'public'
--   and table_name = 'quiz_questions'
--   and column_name = 'correct_answer';

-- VERIFICACION 3 - firma real de is_admin
-- select p.proname, pg_get_function_identity_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'is_admin';
