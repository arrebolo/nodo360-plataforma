-- ============================================================================
-- MIGRACION 024: RLS del sistema de quiz
--
-- *** YA APLICADA EN PRODUCCION EL 20 DE SEPTIEMBRE DE 2026 ***
--
-- Se versiona aqui a posteriori: el cambio se ejecuto a mano en el SQL Editor y
-- solo existia en docs/migrations/021_rls_quiz_security.sql, fuera de esta
-- secuencia. Lo que esta en la base de datos tiene que estar en el repo.
--
-- Contenido: las PARTES 1 y 2A de docs/migrations/021_rls_quiz_security.sql.
-- La PARTE 2B (privilegios de columna sobre correct_answer) se versiona aparte,
-- en 025_quiz_questions_column_grants.sql, porque se aplico despues y de forma
-- distinta a como estaba escrita alli.
--
-- El numero 021 ya estaba ocupado en esta carpeta por 021_message_reports.sql.
--
-- Es idempotente: reejecutarla no cambia nada.
-- ============================================================================

-- ============================================
-- PARTE 1 - course_final_quiz_attempts
-- (contenido integro de la migracion 018, que nunca llego a aplicarse)
-- ============================================
--
-- La tabla guarda los intentos del examen final, de los que sale el
-- certificado. Estaba sin RLS: cualquiera con la clave anonima podia leer los
-- intentos de todos y, sobre todo, insertar un intento aprobado a nombre de
-- otro usuario.

ALTER TABLE public.course_final_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can view own quiz attempts"
ON public.course_final_quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts"
ON public.course_final_quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can update own quiz attempts"
ON public.course_final_quiz_attempts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NOTA sobre is_admin: existe en la base de datos con el parametro nombrado
-- 'check_user_id' y una sola firma. Esta llamada es posicional, por lo que
-- resuelve sin ambiguedad. No renombrar el parametro ni recrear la funcion con
-- otro nombre de argumento: Postgres rechaza CREATE OR REPLACE FUNCTION si
-- cambia el nombre de un parametro (fue el incidente de
-- supabase/migrations/020_message_moderation_flags.sql).
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Admins can view all quiz attempts"
ON public.course_final_quiz_attempts
FOR ALL
USING (is_admin(auth.uid()));


-- ============================================
-- PARTE 2A - quiz_questions: cerrar el acceso anonimo
-- ============================================
--
-- Las rutas /api/quiz/* usan createAdminClient() (service_role), que ignora RLS
-- por diseno, asi que esta parte no las afecta: corta el acceso directo via
-- PostgREST con la clave anonima, que era el agujero.
--
-- Por si solo esto NO impide que correct_answer llegue al navegador: RLS
-- protege filas, no columnas. De eso se encarga la 025.

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Anonimos: sin politica, por tanto sin acceso.

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

DROP POLICY IF EXISTS "Admins manage questions" ON public.quiz_questions;
CREATE POLICY "Admins manage questions"
ON public.quiz_questions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));


-- ============================================================================
-- COMPROBACION (solo lectura, ejecutar aparte)
-- ============================================================================
-- select c.relname, c.relrowsecurity as rls_activo,
--        (select count(*) from pg_policies p
--          where p.tablename = c.relname and p.schemaname = 'public') as politicas
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname in ('course_final_quiz_attempts','quiz_questions');
--
-- Estado esperado y verificado el 21/09/2026 con la clave anonima:
--   GET /rest/v1/course_final_quiz_attempts?select=* -> 200 []
--   GET /rest/v1/quiz_questions?select=*             -> 401 42501 (ver 025)
