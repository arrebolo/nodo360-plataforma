-- ============================================================================
-- MIGRACION 025: quiz_questions - privilegios de tabla y de columna
--
-- *** YA APLICADA EN PRODUCCION EL 20 DE SEPTIEMBRE DE 2026 ***
--
-- Se versiona aqui a posteriori. Nunca estuvo en el repo: la PARTE 2B de
-- docs/migrations/021_rls_quiz_security.sql proponia solo un
-- REVOKE SELECT (correct_answer), y eso NO funciono. Este archivo recoge lo que
-- de verdad se ejecuto.
--
-- POR QUE EL REVOKE POR COLUMNA NO BASTABA
-- Un GRANT de tabla y un GRANT de columna son privilegios independientes y
-- acumulativos. Un REVOKE sobre una columna no resta nada de un GRANT que se
-- concedio sobre la tabla entera: mientras exista el GRANT de tabla, el rol
-- sigue leyendo todas las columnas. Hay que revocar primero a nivel de tabla y
-- despues conceder columna a columna.
--
-- Es idempotente: reejecutarla no cambia nada.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Quitar el privilegio de tabla, que era lo que dejaba pasar correct_answer
-- --------------------------------------------------------------------------

REVOKE ALL ON public.quiz_questions FROM anon;
REVOKE ALL ON public.quiz_questions FROM authenticated;

-- --------------------------------------------------------------------------
-- 2. Devolver solo las columnas que el cliente puede ver
-- --------------------------------------------------------------------------
--
-- correct_answer queda fuera, y explanation tambien: su texto suele revelar la
-- respuesta.
--
-- anon no recibe ningun privilegio: no tiene por que leer preguntas.
--
-- authenticated si lo necesita, porque lib/quiz/checkCourseQuiz.ts consulta
-- quiz_questions con el cliente de usuario para contar si un curso tiene quiz.
-- Sin este GRANT ese conteo devuelve 0 y la plataforma da por hecho que el
-- curso no tiene examen final.

GRANT SELECT (
  id,
  module_id,
  question,
  options,
  order_index,
  difficulty,
  points
) ON public.quiz_questions TO authenticated;

-- service_role (rutas /api/quiz/*) mantiene acceso completo: la correccion es
-- server-side en /api/quiz/submit y necesita correct_answer.
GRANT ALL ON public.quiz_questions TO service_role;


-- ============================================================================
-- ESTADO VERIFICADO EL 21/09/2026
-- ============================================================================
-- Con la clave anonima:
--   GET /rest/v1/quiz_questions?select=*              -> 401 42501 permission denied
--   GET /rest/v1/quiz_questions?select=id,question    -> 401 42501 permission denied
--   GET /rest/v1/quiz_questions?select=correct_answer -> 401 42501 permission denied
-- Con service_role:
--   GET /rest/v1/quiz_questions?select=*              -> 200 con datos
--
-- COMPROBACION (solo lectura, ejecutar aparte)
-- select grantee, column_name, privilege_type
-- from information_schema.column_privileges
-- where table_schema = 'public' and table_name = 'quiz_questions'
--   and grantee in ('anon','authenticated')
-- order by grantee, column_name;
-- No debe aparecer correct_answer para ninguno de los dos.


-- ============================================================================
-- PENDIENTE DE DECISION: la vista quiz_questions_public
-- ============================================================================
--
-- docs/migrations/021 creo public.quiz_questions_public con
-- security_invoker = on y le dio GRANT SELECT a anon y authenticated, con la
-- idea de que fuera la via publica para leer preguntas sin la respuesta.
--
-- Con security_invoker = on la vista se ejecuta con los privilegios de quien
-- consulta, asi que al revocar el acceso de anon a la tabla base la vista dejo
-- de servirle. Comprobado el 21/09/2026:
--
--   anon GET /rest/v1/quiz_questions_public?select=*
--     -> 401 42501: permission denied for table quiz_questions
--
-- Hoy no se rompe nada porque nadie la consume: las preguntas se sirven desde
-- /api/quiz/questions con service_role y lista explicita de columnas. Pero la
-- vista y su GRANT siguen ahi y sugieren un acceso que no existe.
--
-- Hay dos salidas, y es una decision de producto:
--   a) Borrar la vista y su GRANT, y dejar /api/quiz/questions como unica via.
--   b) Pasarla a security_invoker = off (se ejecuta con los privilegios de su
--      propietario) para que anon pueda leer preguntas sin la respuesta.
--      Ojo: eso reabre el acceso anonimo al enunciado de todas las preguntas,
--      incluidas las de cursos no publicados, porque saltaria la RLS de la 024.
--
-- No se toca aqui: este archivo solo documenta lo ya aplicado.
