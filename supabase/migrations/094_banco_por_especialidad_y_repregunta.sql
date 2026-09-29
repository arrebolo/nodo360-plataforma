-- ============================================================================
-- MIGRACION 094: el banco cuelga de la especialidad, y cada pregunta lleva su
--                repregunta oral
--
-- ESQUEMA VOLCADO ANTES DE ESCRIBIR ESTO, que es la regla que me costo tres
-- intentos en la 092:
--
--   instructor_exam_questions
--     model_id        uuid  NOT NULL  FK -> instructor_exam_models.id
--     question        text  NOT NULL
--     options         jsonb NOT NULL
--     correct_answer  integer NOT NULL
--     order_index     integer NOT NULL
--     difficulty      text  NOT NULL  DEFAULT 'hard'
--     points          integer DEFAULT 1
--     category        text
--
--   Y sus dos CHECK, de la 008:
--     difficulty IN ('medium', 'hard', 'expert')
--     CONSTRAINT valid_order_index CHECK (order_index >= 1 AND order_index <= 20)
--
-- QUE CAMBIA, Y POR QUE
-- Las preguntas nacieron pegadas a un MODELO: diez modelos por examen, veinte
-- preguntas cada uno, y el order_index era la posicion dentro del modelo. De ahi
-- el 1..20.
--
-- El banco por especialidad invierte eso: las preguntas cuelgan de la
-- especialidad, con model_id a NULL, y el orden se asigna EN CADA INTENTO. Una
-- pregunta del banco no tiene una posicion fija, asi que order_index deja de
-- tener sentido para ella —y la restriccion 1..20 dejaria fuera la pregunta 21.
--
--   · model_id     pasa a admitir NULL
--   · order_index  pasa a admitir NULL, y su CHECK solo se aplica cuando hay
--                  valor: una pregunta de modelo sigue estando entre 1 y 20
--   · specialty_id nueva, el eje del banco
--   · y una pregunta pertenece a un modelo O a un banco, nunca a los dos ni a
--     ninguno. Eso se escribe como restriccion, no como costumbre.
--
-- El CHECK de model_number de instructor_exam_models NO se toca, como acordamos.
-- Y difficulty sigue con su vocabulario de tres valores.
--
-- LA REPREGUNTA ORAL
-- oral_followup es lo que el evaluador pregunta EN VOZ ALTA despues de la
-- pregunta escrita. Sirve para separar a quien entendio de quien recuerda cual
-- era la opcion correcta.
--
-- oral_rubric es lo que hace que esa repregunta no dependa del ojo de cada
-- evaluador: dos o tres puntos que una respuesta comprensiva tiene que tocar, y
-- una señal tipica de respuesta memorizada. Va en jsonb con forma fija:
--
--   {
--     "debe_contener": ["...", "...", "..."],
--     "senal_de_memorizado": "..."
--   }
--
-- La forma se comprueba con un CHECK sobre las claves. Sin el, en tres meses
-- habria cuatro formas distintas conviviendo.
--
-- NO INSERTA NI UNA PREGUNTA. El banco sigue a 0 filas: las treinta de Ethereum
-- van aparte, despues de revisarlas.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Las columnas nuevas
-- =====================================================

ALTER TABLE public.instructor_exam_questions
  ADD COLUMN IF NOT EXISTS specialty_id uuid
    REFERENCES public.instructor_specialties(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS oral_followup text,
  ADD COLUMN IF NOT EXISTS oral_rubric jsonb;

COMMENT ON COLUMN public.instructor_exam_questions.specialty_id IS
  'El banco al que pertenece la pregunta. Excluyente con model_id: o cuelga de un modelo fijo, o del banco de una especialidad.';

COMMENT ON COLUMN public.instructor_exam_questions.oral_followup IS
  'La repregunta que el evaluador hace EN VOZ ALTA despues de la pregunta escrita. Separa a quien entendio de quien recuerda cual era la opcion correcta.';

COMMENT ON COLUMN public.instructor_exam_questions.oral_rubric IS
  'Para que la repregunta no dependa del ojo de cada evaluador. Forma fija: {"debe_contener": ["...","..."], "senal_de_memorizado": "..."}. Dos o tres puntos que una respuesta comprensiva tiene que tocar, y una señal tipica de respuesta memorizada.';

CREATE INDEX IF NOT EXISTS idx_instructor_exam_questions_specialty
  ON public.instructor_exam_questions (specialty_id);

-- =====================================================
-- 2. Lo que el banco hace opcional
-- =====================================================

ALTER TABLE public.instructor_exam_questions ALTER COLUMN model_id    DROP NOT NULL;
ALTER TABLE public.instructor_exam_questions ALTER COLUMN order_index DROP NOT NULL;

COMMENT ON COLUMN public.instructor_exam_questions.model_id IS
  'El modelo fijo al que pertenece, si es una pregunta de modelo. Nulo en las del banco por especialidad, donde el orden se asigna en cada intento.';

COMMENT ON COLUMN public.instructor_exam_questions.order_index IS
  'Posicion dentro de su modelo, de 1 a 20. Nulo en las preguntas del banco: ahi el orden lo decide el intento, no la fila.';

-- =====================================================
-- 3. Las restricciones, localizadas por su DEFINICION
-- =====================================================
-- No por su nombre. El nombre de una es valid_order_index y el de la otra lo
-- puso Postgres; suponerlos es lo que rompio la 092 tres veces.

DO $do$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
     WHERE con.conrelid = 'public.instructor_exam_questions'::regclass
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%order_index%'
  LOOP
    RAISE NOTICE 'Retirando CHECK de order_index: %  ->  %', c.conname, c.def;
    EXECUTE format('ALTER TABLE public.instructor_exam_questions DROP CONSTRAINT %I', c.conname);
  END LOOP;

  -- Y la de pertenencia, por si una ejecucion anterior la dejo
  FOR c IN
    SELECT con.conname
      FROM pg_constraint con
     WHERE con.conrelid = 'public.instructor_exam_questions'::regclass
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%specialty_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.instructor_exam_questions DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$do$;

-- El rango sigue valiendo, pero solo cuando hay posicion. Una pregunta del
-- banco con order_index NULL pasa; la numero 21 de un modelo, no.
ALTER TABLE public.instructor_exam_questions
  ADD CONSTRAINT valid_order_index
  CHECK (order_index IS NULL OR (order_index >= 1 AND order_index <= 20));

-- Un modelo o un banco. Nunca los dos, nunca ninguno.
ALTER TABLE public.instructor_exam_questions
  ADD CONSTRAINT pregunta_de_modelo_o_de_banco
  CHECK (
    (model_id IS NOT NULL AND specialty_id IS NULL)
    OR (model_id IS NULL AND specialty_id IS NOT NULL)
  );

-- La forma de la rubrica, para que no haya cuatro formas en tres meses.
DO $do$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
      FROM pg_constraint con
     WHERE con.conrelid = 'public.instructor_exam_questions'::regclass
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%oral_rubric%'
  LOOP
    EXECUTE format('ALTER TABLE public.instructor_exam_questions DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$do$;

ALTER TABLE public.instructor_exam_questions
  ADD CONSTRAINT forma_de_la_rubrica_oral
  CHECK (
    oral_rubric IS NULL
    OR (
      jsonb_typeof(oral_rubric) = 'object'
      AND oral_rubric ? 'debe_contener'
      AND oral_rubric ? 'senal_de_memorizado'
      AND jsonb_typeof(oral_rubric -> 'debe_contener') = 'array'
      AND jsonb_array_length(oral_rubric -> 'debe_contener') BETWEEN 2 AND 4
    )
  );

-- =====================================================
-- 4. La prueba, dentro de la propia migracion
-- =====================================================

DO $prueba$
DECLARE
  v_esp     uuid;
  v_modelo  uuid;
  v_id      uuid;
BEGIN
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';
  SELECT id INTO v_modelo FROM public.instructor_exam_models ORDER BY created_at LIMIT 1;

  IF v_esp IS NULL THEN
    RAISE EXCEPTION 'Falta la especialidad ethereum-contratos. ¿Se aplico la 090?';
  END IF;
  IF v_modelo IS NULL THEN
    RAISE EXCEPTION 'No hay ningun modelo de examen. Se esperaban 40.';
  END IF;

  -- 1. Una pregunta de BANCO: sin modelo, sin posicion, con repregunta
  INSERT INTO public.instructor_exam_questions
    (specialty_id, question, options, correct_answer, difficulty, oral_followup, oral_rubric)
  VALUES (
    v_esp, 'PRUEBA-094 ¿pregunta de banco?', '["a","b","c","d"]'::jsonb, 0, 'hard',
    'PRUEBA-094 repregunta',
    '{"debe_contener": ["uno", "dos"], "senal_de_memorizado": "repite la opcion"}'::jsonb
  )
  RETURNING id INTO v_id;
  RAISE NOTICE 'PRUEBA 1  pregunta de banco: sin modelo y sin posicion       PASA';

  -- 2. Una de MODELO sigue exigiendo posicion valida
  BEGIN
    INSERT INTO public.instructor_exam_questions
      (model_id, question, options, correct_answer, order_index, difficulty)
    VALUES (v_modelo, 'PRUEBA-094 posicion 25', '["a","b","c","d"]'::jsonb, 0, 25, 'hard');
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se pudo insertar un order_index de 25.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 2  una de modelo sigue atada al rango 1..20          PASA';
  END;

  -- 3. Ni de modelo ni de banco: imposible
  BEGIN
    INSERT INTO public.instructor_exam_questions
      (question, options, correct_answer, difficulty)
    VALUES ('PRUEBA-094 huerfana', '["a","b","c","d"]'::jsonb, 0, 'hard');
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se pudo insertar una pregunta sin modelo ni banco.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 3  ni modelo ni banco: imposible                     PASA';
  END;

  -- 4. Las dos cosas a la vez: tambien imposible
  BEGIN
    INSERT INTO public.instructor_exam_questions
      (model_id, specialty_id, question, options, correct_answer, order_index, difficulty)
    VALUES (v_modelo, v_esp, 'PRUEBA-094 las dos', '["a","b","c","d"]'::jsonb, 0, 1, 'hard');
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: se pudo insertar con modelo Y banco.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 4  modelo y banco a la vez: imposible                PASA';
  END;

  -- 5. Una rubrica con la forma mal
  BEGIN
    UPDATE public.instructor_exam_questions
       SET oral_rubric = '{"puntos": ["uno"]}'::jsonb
     WHERE id = v_id;
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: se pudo guardar una rubrica con otra forma.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 5  la rubrica solo admite su forma                   PASA';
  END;

  DELETE FROM public.instructor_exam_questions WHERE question LIKE 'PRUEBA-094%';
  RAISE NOTICE 'Filas de prueba borradas. Las cinco pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_exam_questions'
      AND column_name IN ('specialty_id','oral_followup','oral_rubric'))        AS columnas_nuevas,

  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_exam_questions'
      AND column_name IN ('model_id','order_index')
      AND is_nullable = 'YES')                                                  AS opcionales_de_2,

  -- La CHECK de order_index, por su contenido: tiene que admitir el nulo
  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_exam_questions'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%order_index%'
      AND pg_get_constraintdef(oid) ILIKE '%IS NULL%')                          AS check_de_orden_admite_nulo,

  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.instructor_exam_questions'::regclass
             AND conname = 'pregunta_de_modelo_o_de_banco')                     AS check_de_pertenencia,

  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.instructor_exam_questions'::regclass
             AND conname = 'forma_de_la_rubrica_oral')                          AS check_de_la_rubrica,

  -- Lo que NO se ha tocado
  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_exam_models'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%model_number%')                     AS check_de_model_number_intacta,

  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_exam_questions'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%difficulty%')                       AS check_de_difficulty_intacta,

  (SELECT count(*) FROM public.instructor_exam_questions)                       AS preguntas,
  (SELECT count(*) FROM public.instructor_exam_models)                          AS modelos,
  (SELECT count(*) FROM public.instructor_exam_questions
    WHERE question LIKE 'PRUEBA-094%')                                          AS filas_de_prueba_que_quedan,

  CASE
    WHEN (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_exam_questions'
             AND column_name IN ('specialty_id','oral_followup','oral_rubric')) = 3
     AND (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_exam_questions'
             AND column_name IN ('model_id','order_index')
             AND is_nullable = 'YES') = 2
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_exam_questions'::regclass AND contype = 'c'
             AND pg_get_constraintdef(oid) ILIKE '%order_index%'
             AND pg_get_constraintdef(oid) ILIKE '%IS NULL%') = 1
     AND EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.instructor_exam_questions'::regclass
                    AND conname = 'pregunta_de_modelo_o_de_banco')
     AND EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.instructor_exam_questions'::regclass
                    AND conname = 'forma_de_la_rubrica_oral')
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_exam_models'::regclass AND contype = 'c'
             AND pg_get_constraintdef(oid) ILIKE '%model_number%') >= 1
     AND (SELECT count(*) FROM public.instructor_exam_models) = 40
     AND (SELECT count(*) FROM public.instructor_exam_questions
           WHERE question LIKE 'PRUEBA-094%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                           AS veredicto;
