-- ============================================================================
-- 087: el banco de preguntas del examen de instructor deja de ser legible
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/087-aplicar.sql
--
-- QUE SE MIDIO, Y COMO
--   Con una pregunta señuelo y un intento temporal, los dos borrados despues:
--
--     clave anonima, sin sesion .................. 0 filas   correcto
--     usuario con sesion, sin intento ............ 0 filas   correcto
--     usuario con sesion Y un intento in_progress  LAS PREGUNTAS DE SU MODELO,
--                                                  con correct_answer y
--                                                  explanation EN CLARO
--
--   La salida literal de la prueba:
--       >>> SENUELO-QA-BORRAR ¿cuanto es 2+2?
--           correct_answer = 3   <<< LA RESPUESTA, EN CLARO
--
--   POR QUE: la RLS filtra FILAS, no columnas, y no hay ningun GRANT de columna
--   sobre esta tabla. La ruta de API es cuidadosa -sirve id, question, options,
--   order_index, difficulty, points y category, nunca correct_answer- pero LA
--   RUTA NO ES LA UNICA PUERTA: la clave anonima es publica y PostgREST es
--   alcanzable sin pasar por la web.
--
-- Y EL EXAMEN, HOY, NO FUNCIONA. TRES FALLOS INDEPENDIENTES
--   1. El banco esta a 0 preguntas.
--   2. Las dos rutas -attempt y submit- leen las preguntas con el CLIENTE DE
--      SESION, y la politica del candidato exige un intento con
--      status = 'in_progress' que el codigo nunca crea (el intento se crea en
--      submit) y que el esquema NO PUEDE GUARDAR, porque completed_at y
--      time_spent_seconds son NOT NULL mientras status admite 'in_progress'.
--      Resultado: el candidato veria un examen con CERO preguntas, y submit
--      puntuaria sobre cero.
--   3. submit selecciona `correct_option`, UNA COLUMNA QUE NO EXISTE. La real
--      es correct_answer. Mismo fallo que learning_paths.title en la #231: la
--      consulta falla y nadie se entera porque no hay datos que devolver.
--
--   Los tres se arreglan: este fichero el 1 de seguridad y el esquema, y el
--   codigo de la misma PR los otros dos.
--
-- LA DECISION
--   El candidato NO LEE esta tabla. Con ninguna clave, nunca. Las preguntas las
--   sirve el servidor con el cliente de servicio, eligiendo columnas. Asi
--   correct_answer no es alcanzable ni equivocandose al escribir un select.
--
--   Dos vias independientes, como en user_badges: sin politica y sin GRANT.
--
-- REEJECUTABLE: DROP POLICY IF EXISTS, REVOKE idempotente, y los ALTER COLUMN
-- DROP NOT NULL no dan error si ya se aplicaron.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Fuera la politica que dejaba leer el banco al candidato
-- ----------------------------------------------------------------------------
-- Se retira por lo que hace, no solo por su nombre: se recorren todas las de
-- SELECT y se dejan unicamente las de administracion.
DO $do$
DECLARE
  p           RECORD;
  v_retiradas TEXT[] := '{}';
BEGIN
  FOR p IN
    SELECT policyname, qual
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'instructor_exam_questions'
       AND cmd        = 'SELECT'
     ORDER BY policyname
  LOOP
    EXECUTE format('DROP POLICY %I ON public.instructor_exam_questions', p.policyname);
    v_retiradas := v_retiradas || (p.policyname::text || '  USING ' || coalesce(p.qual, '(sin USING)'));
  END LOOP;

  RAISE NOTICE 'politicas de SELECT retiradas: %', coalesce(array_length(v_retiradas, 1), 0);
  IF array_length(v_retiradas, 1) > 0 THEN
    RAISE NOTICE '  %', array_to_string(v_retiradas, E'\n  ');
  END IF;
END
$do$;

-- La de administracion se vuelve a poner, explicita y solo para lectura y
-- escritura de admin. es_admin_actual() es la puerta de la casa (034).
DROP POLICY IF EXISTS "Admins can manage questions" ON public.instructor_exam_questions;

CREATE POLICY "Solo administracion gestiona el banco"
  ON public.instructor_exam_questions FOR ALL
  TO authenticated
  USING (public.es_admin_actual())
  WITH CHECK (public.es_admin_actual());


-- ----------------------------------------------------------------------------
-- 2. Y el permiso de tabla, que es la segunda via
-- ----------------------------------------------------------------------------
-- El servidor lee con service_role, que no pasa por aqui. REVOKE de un permiso
-- que no se tiene no da error.
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.instructor_exam_questions FROM anon;
REVOKE SELECT ON public.instructor_exam_questions FROM authenticated;


COMMENT ON TABLE public.instructor_exam_questions IS 'Banco de preguntas del examen de instructor. NO LO LEE NADIE CON SESION: desde la 087 no hay politica de SELECT para el candidato ni GRANT de SELECT para authenticated, porque la RLS filtra filas y no columnas y correct_answer quedaba en claro para quien tuviera un intento en curso. Las preguntas las sirve el servidor con service_role eligiendo columnas, nunca correct_answer. Para cambiar el banco, el panel de administracion.';


-- ----------------------------------------------------------------------------
-- 3. Un intento EN CURSO tiene que poder existir
-- ----------------------------------------------------------------------------
-- status admite 'in_progress' desde la 008, pero seis columnas NOT NULL lo
-- hacian imposible: un intento que empieza no tiene puntuacion ni fecha de fin.
-- Es la base del tiempo por pregunta y de las señales de la fase B.
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN score              DROP NOT NULL;
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN correct_answers    DROP NOT NULL;
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN passed             DROP NOT NULL;
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN answers            DROP NOT NULL;
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN completed_at       DROP NOT NULL;
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN time_spent_seconds DROP NOT NULL;

COMMENT ON TABLE public.instructor_exam_attempts IS 'Intentos del examen de instructor. Desde la 087 un intento EN CURSO puede existir de verdad: score, correct_answers, passed, answers, completed_at y time_spent_seconds admiten NULL hasta que se entrega. Antes eran NOT NULL con un status que admitia in_progress, asi que la politica que dependia de ese estado no podia encajar nunca.';


-- ----------------------------------------------------------------------------
-- 4. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     politicas_select_banco -> 0      ninguna para el candidato
--     politicas_banco        -> 1      la de administracion, FOR ALL
--     auth_lee_banco         -> false
--     anon_lee_banco         -> false
--     intento_en_curso_posible -> true  las seis columnas admiten NULL
--     preguntas              -> 0      el banco sigue vacio; se llena aparte
--     veredicto              -> TODO CORRECTO
SELECT
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'instructor_exam_questions'
      AND cmd = 'SELECT')                                                AS politicas_select_banco,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'instructor_exam_questions') AS politicas_banco,

  has_table_privilege('authenticated', 'public.instructor_exam_questions', 'SELECT') AS auth_lee_banco,
  has_table_privilege('anon', 'public.instructor_exam_questions', 'SELECT')          AS anon_lee_banco,

  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempts'
       AND column_name IN ('score','correct_answers','passed','answers','completed_at','time_spent_seconds')
       AND is_nullable = 'NO'
  )                                                                      AS intento_en_curso_posible,

  (SELECT count(*) FROM public.instructor_exam_questions)                 AS preguntas,

  CASE
    WHEN (SELECT count(*) FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'instructor_exam_questions'
             AND cmd = 'SELECT') = 0
     AND NOT has_table_privilege('authenticated', 'public.instructor_exam_questions', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.instructor_exam_questions', 'SELECT')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempts'
          AND column_name IN ('score','correct_answers','passed','answers','completed_at','time_spent_seconds')
          AND is_nullable = 'NO')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                    AS veredicto;
