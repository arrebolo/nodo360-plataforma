-- ============================================================================
-- MIGRACION 095: el examen se sirve desde el banco, 15 preguntas sin repetir
--
-- ESQUEMA VOLCADO ANTES DE ESCRIBIR ESTO:
--
--   instructor_exam_questions   (ya con la 094)
--     model_id      uuid     NULL      FK -> instructor_exam_models.id
--     specialty_id  uuid     NULL      FK -> instructor_specialties.id
--     order_index   integer  NULL
--     correct_answer integer NOT NULL
--
--   instructor_exam_attempts
--     model_id          uuid     NOT NULL  FK -> instructor_exam_models.id
--     total_questions   integer  NOT NULL
--     started_at        timestamptz NOT NULL  (sin defecto)
--     status            text NOT NULL DEFAULT 'completed'
--                       CHECK (status IN ('in_progress','completed','timed_out','abandoned'))
--     models_exhausted  boolean DEFAULT false
--
-- QUE CAMBIA, Y POR QUE
-- Hasta ahora el examen iba por MODELOS: select_exam_model() elegia un modelo
-- aleatorio no usado y la ruta leia sus veinte preguntas con
-- .eq('model_id', modelId). Con el banco por especialidad no hay modelo que
-- elegir, asi que hace falta:
--
--   1. que un intento pueda existir sin modelo  -> model_id admite NULL
--   2. donde apuntar QUE preguntas le toparon a ese intento -> tabla nueva
--   3. quien las elige, sin que la eleccion salga del cliente -> servir_preguntas()
--
-- LAS QUINCE, SIN REPETIR
-- Cada intento recibe 15 preguntas del banco de su especialidad, elegidas al
-- azar entre las que ESA persona no ha visto nunca en ESE examen. Eso sustituye
-- a la logica de modelos agotados: ya no se cuentan modelos usados, se cuentan
-- preguntas vistas.
--
-- Consecuencia que conviene tener presente: con 30 preguntas en el banco, un
-- candidato tiene exactamente DOS intentos antes de agotarlo. El tercero no se
-- puede servir, y servir_preguntas lo dice con su cuenta en el mensaje en vez de
-- devolver un examen corto. Un examen de 9 preguntas no es el mismo examen.
--
-- POR QUE SERVIR_PREGUNTAS CREA EL INTENTO
-- Porque si no, hay un orden en el que todo se rompe: crear el intento, fallar
-- al servir y dejar un intento huerfano que encima cuenta como visto. Creando y
-- sirviendo en la misma funcion, o pasan las dos cosas o no pasa ninguna.
--
-- Y NO LA PUEDE LLAMAR UNA SESION
-- Devuelve el enunciado y las opciones de 15 preguntas del banco. Si pudiera
-- llamarla el candidato, tendria el banco entero a base de repetir llamadas. Va
-- con la guarda de la 091: auth.uid() IS NOT NULL -> 42501, y EXECUTE solo para
-- service_role. Las respuestas correctas NO salen de la funcion, igual que no
-- salen del select de la ruta desde la 087.
--
-- NO BORRA NI UNA FILA. No inserta ninguna pregunta: el banco sigue a 0.
-- Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Un intento puede existir sin modelo
-- =====================================================

ALTER TABLE public.instructor_exam_attempts ALTER COLUMN model_id DROP NOT NULL;

-- Y nace en curso, no completado. El defecto decia 'completed', que describe un
-- intento que ya termino: lo natural al crear la fila es lo contrario.
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN status SET DEFAULT 'in_progress';

-- started_at era NOT NULL sin defecto. Un intento empieza cuando se crea.
ALTER TABLE public.instructor_exam_attempts ALTER COLUMN started_at SET DEFAULT now();

COMMENT ON COLUMN public.instructor_exam_attempts.model_id IS
  'El modelo fijo, si el examen va por modelos. Nulo cuando las preguntas salen del banco de la especialidad, que es el camino desde la 095.';

COMMENT ON COLUMN public.instructor_exam_attempts.models_exhausted IS
  'EN RETIRADA. Contaba modelos agotados. Desde la 095 lo que se agota son las preguntas sin ver, y eso no se guarda: se calcula contra instructor_exam_attempt_questions.';

-- =====================================================
-- 2. Que preguntas le tocaron a cada intento
-- =====================================================

CREATE TABLE IF NOT EXISTS public.instructor_exam_attempt_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id  uuid NOT NULL REFERENCES public.instructor_exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.instructor_exam_questions(id) ON DELETE RESTRICT,
  posicion    integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT posicion_valida CHECK (posicion >= 1),
  CONSTRAINT una_pregunta_por_intento UNIQUE (attempt_id, question_id),
  CONSTRAINT una_posicion_por_intento UNIQUE (attempt_id, posicion)
);

COMMENT ON TABLE public.instructor_exam_attempt_questions IS
  'Que preguntas se sirvieron en cada intento y en que orden. Sin esto, submit tendria que corregir contra el banco entero y alguien podria responder a preguntas que no le tocaron. Ademas es lo que permite no repetir: una pregunta que aparece aqui ya la vio ese candidato.';

COMMENT ON COLUMN public.instructor_exam_attempt_questions.posicion IS
  'El orden en ESE intento. La pregunta no tiene posicion propia: order_index quedo a NULL en el banco con la 094.';

-- ON DELETE RESTRICT en question_id a proposito: borrar una pregunta del banco
-- borraria la constancia de que a alguien le toco, y con ella la correccion de
-- su intento. Si una pregunta hay que retirarla, se desactiva, no se borra.

CREATE INDEX IF NOT EXISTS idx_attempt_questions_attempt
  ON public.instructor_exam_attempt_questions (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_questions_question
  ON public.instructor_exam_attempt_questions (question_id);

-- Cerrada como el banco de la 087: nadie con sesion la lee ni la escribe. El
-- candidato recibe sus preguntas por la ruta, con el cliente de servicio.
ALTER TABLE public.instructor_exam_attempt_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo administracion ve que preguntas tocaron"
  ON public.instructor_exam_attempt_questions;

CREATE POLICY "Solo administracion ve que preguntas tocaron"
  ON public.instructor_exam_attempt_questions
  FOR SELECT
  TO authenticated
  USING (public.es_admin_actual());

REVOKE ALL ON public.instructor_exam_attempt_questions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.instructor_exam_attempt_questions FROM authenticated;
GRANT SELECT ON public.instructor_exam_attempt_questions TO authenticated;

-- =====================================================
-- 3. servir_preguntas
-- =====================================================

DROP FUNCTION IF EXISTS public.servir_preguntas(uuid, uuid, integer);

CREATE FUNCTION public.servir_preguntas(
  p_user_id  uuid,
  p_exam_id  uuid,
  p_cuantas  integer DEFAULT 15
)
RETURNS TABLE (
  attempt_id  uuid,
  question_id uuid,
  posicion    integer,
  question    text,
  options     jsonb,
  difficulty  text,
  points      integer,
  category    text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_especialidad uuid;
  v_intento      uuid;
  v_sin_ver      integer;
BEGIN
  -- Solo el servidor. Devuelve enunciados del banco: si la llamara el
  -- candidato, tendria el banco entero repitiendo llamadas.
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Solo el servidor puede servir preguntas de examen'
      USING ERRCODE = '42501';
  END IF;

  IF p_cuantas IS NULL OR p_cuantas < 1 THEN
    RAISE EXCEPTION 'Hay que pedir al menos una pregunta (se pidieron %).', p_cuantas;
  END IF;

  SELECT e.specialty_id INTO v_especialidad
    FROM public.instructor_exams e
   WHERE e.id = p_exam_id;

  IF v_especialidad IS NULL THEN
    RAISE EXCEPTION 'El examen % no existe o no tiene especialidad. ¿Se aplico la 092?', p_exam_id;
  END IF;

  -- Las que esta persona NO ha visto nunca en este examen
  SELECT count(*) INTO v_sin_ver
    FROM public.instructor_exam_questions q
   WHERE q.specialty_id = v_especialidad
     AND NOT EXISTS (
       SELECT 1
         FROM public.instructor_exam_attempt_questions aq
         JOIN public.instructor_exam_attempts a ON a.id = aq.attempt_id
        WHERE aq.question_id = q.id
          AND a.user_id = p_user_id
          AND a.exam_id = p_exam_id
     );

  IF v_sin_ver < p_cuantas THEN
    RAISE EXCEPTION
      'No quedan preguntas sin ver suficientes: hacen falta % y quedan %. Un examen mas corto no es el mismo examen.',
      p_cuantas, v_sin_ver
      USING ERRCODE = 'P0001';
  END IF;

  -- El intento y las preguntas, en la misma funcion: o las dos cosas o ninguna.
  INSERT INTO public.instructor_exam_attempts (user_id, exam_id, total_questions, status)
  VALUES (p_user_id, p_exam_id, p_cuantas, 'in_progress')
  RETURNING id INTO v_intento;

  INSERT INTO public.instructor_exam_attempt_questions (attempt_id, question_id, posicion)
  SELECT v_intento, elegidas.id, elegidas.posicion
    FROM (
      SELECT q.id, row_number() OVER (ORDER BY random()) AS posicion
        FROM public.instructor_exam_questions q
       WHERE q.specialty_id = v_especialidad
         AND NOT EXISTS (
           SELECT 1
             FROM public.instructor_exam_attempt_questions aq
             JOIN public.instructor_exam_attempts a ON a.id = aq.attempt_id
            WHERE aq.question_id = q.id
              AND a.user_id = p_user_id
              AND a.exam_id = p_exam_id
              AND a.id <> v_intento
         )
       ORDER BY random()
       LIMIT p_cuantas
    ) AS elegidas;

  -- Y se devuelven SIN correct_answer. No es un olvido: es lo unico que separa
  -- al candidato de las respuestas, igual que en el select de la 087.
  RETURN QUERY
    SELECT v_intento, q.id, aq.posicion, q.question, q.options, q.difficulty, q.points, q.category
      FROM public.instructor_exam_attempt_questions aq
      JOIN public.instructor_exam_questions q ON q.id = aq.question_id
     WHERE aq.attempt_id = v_intento
     ORDER BY aq.posicion;
END
$fn$;

COMMENT ON FUNCTION public.servir_preguntas(uuid, uuid, integer) IS
  'Crea un intento y le sirve N preguntas del banco de la especialidad del examen, al azar entre las que esa persona no ha visto nunca en ese examen. Crea el intento ella misma para que no queden intentos huerfanos que ademas cuentan como vistos. NO devuelve correct_answer. Solo service_role.';

REVOKE ALL ON FUNCTION public.servir_preguntas(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.servir_preguntas(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.servir_preguntas(uuid, uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.servir_preguntas(uuid, uuid, integer) TO service_role;

-- =====================================================
-- 4. La prueba, dentro de la propia migracion
-- =====================================================
-- Con preguntas de usar y tirar: el banco esta a 0 y sigue a 0 al terminar.

DO $prueba$
DECLARE
  v_usuario uuid;
  v_esp     uuid;
  v_examen  uuid;
  v_n       integer;
  v_intento uuid;
  v_i       integer;
BEGIN
  SELECT id INTO v_usuario FROM public.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';
  SELECT id INTO v_examen FROM public.instructor_exams WHERE specialty_id = v_esp LIMIT 1;

  IF v_usuario IS NULL OR v_esp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un usuario y la especialidad ethereum-contratos.';
  END IF;
  IF v_examen IS NULL THEN
    RAISE NOTICE 'PRUEBA OMITIDA: ethereum-contratos no tiene examen todavia.';
    RETURN;
  END IF;

  -- Cuatro preguntas de usar y tirar
  FOR v_i IN 1..4 LOOP
    INSERT INTO public.instructor_exam_questions
      (specialty_id, question, options, correct_answer, difficulty)
    VALUES (v_esp, 'PRUEBA-095 numero ' || v_i, '["a","b","c","d"]'::jsonb, 0, 'hard');
  END LOOP;

  -- 1. Sirve 3 de 4, y las apunta
  SELECT count(*) INTO v_n FROM public.servir_preguntas(v_usuario, v_examen, 3);
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: se pidieron 3 preguntas y llegaron %.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 1  sirve las que se le piden y crea el intento        PASA';

  SELECT aq.attempt_id INTO v_intento
    FROM public.instructor_exam_attempt_questions aq
    JOIN public.instructor_exam_attempts a ON a.id = aq.attempt_id
   WHERE a.user_id = v_usuario AND a.exam_id = v_examen
   LIMIT 1;

  IF (SELECT status FROM public.instructor_exam_attempts WHERE id = v_intento) <> 'in_progress' THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el intento no nace en in_progress.';
  END IF;
  IF (SELECT model_id FROM public.instructor_exam_attempts WHERE id = v_intento) IS NOT NULL THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el intento trae un modelo y no deberia.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  el intento nace en curso y sin modelo              PASA';

  -- 3. No se repiten: solo queda 1 sin ver, asi que pedir 3 tiene que negarse
  BEGIN
    PERFORM * FROM public.servir_preguntas(v_usuario, v_examen, 3);
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: sirvio preguntas repetidas.';
  EXCEPTION WHEN raise_exception THEN
    IF sqlerrm LIKE 'PRUEBA 3 FALLIDA%' THEN RAISE; END IF;
    RAISE NOTICE 'PRUEBA 3  no repite: con 1 sin ver, no sirve 3             PASA';
  END;

  -- 4. Pero la que queda sin ver si se puede servir
  SELECT count(*) INTO v_n FROM public.servir_preguntas(v_usuario, v_examen, 1);
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: quedaba 1 sin ver y llegaron %.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 4  la ultima sin ver si se sirve                      PASA';

  -- 5. Y no devuelve la respuesta correcta
  IF EXISTS (
    SELECT 1 FROM information_schema.routines r
      JOIN information_schema.parameters p ON p.specific_name = r.specific_name
     WHERE r.routine_schema = 'public' AND r.routine_name = 'servir_preguntas'
       AND p.parameter_name = 'correct_answer'
  ) THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: servir_preguntas devuelve correct_answer.';
  END IF;
  RAISE NOTICE 'PRUEBA 5  no devuelve correct_answer                         PASA';

  -- Limpieza: los intentos y sus filas, y las preguntas de prueba
  DELETE FROM public.instructor_exam_attempts
   WHERE user_id = v_usuario AND exam_id = v_examen
     AND id IN (SELECT DISTINCT aq.attempt_id
                  FROM public.instructor_exam_attempt_questions aq
                  JOIN public.instructor_exam_questions q ON q.id = aq.question_id
                 WHERE q.question LIKE 'PRUEBA-095%');
  DELETE FROM public.instructor_exam_questions WHERE question LIKE 'PRUEBA-095%';
  RAISE NOTICE 'Filas de prueba borradas. Las cinco pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  to_regclass('public.instructor_exam_attempt_questions') IS NOT NULL            AS tabla_creada,
  to_regprocedure('public.servir_preguntas(uuid,uuid,integer)') IS NOT NULL      AS funcion_creada,

  (SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempts'
      AND column_name = 'model_id')                                              AS intento_sin_modelo,

  (SELECT column_default FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempts'
      AND column_name = 'status')                                                AS estado_por_defecto,

  -- Que la funcion NO devuelve la respuesta correcta
  NOT (pg_get_functiondef('public.servir_preguntas(uuid,uuid,integer)'::regprocedure)
        ILIKE '%correct_answer,%')                                               AS sin_respuesta_correcta,

  has_function_privilege('authenticated', 'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')
                                                                                 AS auth_puede_servir,
  has_function_privilege('service_role', 'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')
                                                                                 AS servicio_puede_servir,

  (SELECT relrowsecurity FROM pg_class
    WHERE oid = 'public.instructor_exam_attempt_questions'::regclass)             AS rls_en_la_tabla,
  has_table_privilege('anon', 'public.instructor_exam_attempt_questions', 'SELECT') AS anon_lee_la_tabla,

  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_exam_attempt_questions'::regclass
      AND contype = 'u')                                                         AS uniques_de_la_tabla,

  (SELECT count(*) FROM public.instructor_exam_questions)                        AS preguntas,
  (SELECT count(*) FROM public.instructor_exam_attempts)                         AS intentos,
  (SELECT count(*) FROM public.instructor_exam_attempt_questions)                AS filas_servidas,
  (SELECT count(*) FROM public.instructor_exam_questions
    WHERE question LIKE 'PRUEBA-095%')                                           AS filas_de_prueba_que_quedan,

  CASE
    WHEN to_regclass('public.instructor_exam_attempt_questions') IS NOT NULL
     AND to_regprocedure('public.servir_preguntas(uuid,uuid,integer)') IS NOT NULL
     AND (SELECT is_nullable FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempts'
             AND column_name = 'model_id') = 'YES'
     AND NOT (pg_get_functiondef('public.servir_preguntas(uuid,uuid,integer)'::regprocedure)
               ILIKE '%correct_answer,%')
     AND NOT has_function_privilege('authenticated', 'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')
     AND has_function_privilege('service_role', 'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')
     AND (SELECT relrowsecurity FROM pg_class
           WHERE oid = 'public.instructor_exam_attempt_questions'::regclass)
     AND NOT has_table_privilege('anon', 'public.instructor_exam_attempt_questions', 'SELECT')
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_exam_attempt_questions'::regclass
             AND contype = 'u') = 2
     AND (SELECT count(*) FROM public.instructor_exam_questions
           WHERE question LIKE 'PRUEBA-095%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
