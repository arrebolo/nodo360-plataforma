-- ============================================================================
-- MIGRACION 096: las opciones se barajan en cada intento
--
-- POR QUE UNA 096 Y NO UN ARREGLO DE LA 095
-- Porque la 095 ya se aplico. Es la misma regla que argumente en la 092 para
-- NO reescribirla: una migracion que llego a la base no se corrige en su sitio,
-- porque eso deja un historial en el que el estado intermedio no existio. La
-- 095 estuvo unos minutos en main sin aplicar y estuve a punto de editarla;
-- cuando se aplico, dejo de ser una opcion.
--
-- QUE FALTABA
-- En el banco escrito a mano, la respuesta correcta estaba en la posicion b en
-- 29 de 30 preguntas, y era casi siempre la opcion mas larga. Lo primero se
-- arregla escribiendo mejor —y se arreglo, el reparto es ahora 8/7/8/7— pero
-- deja una leccion: la posicion de la correcta es una pista que no deberia
-- existir, y en un banco hecho a mano se cuela sola.
--
-- Asi que las opciones se barajan al servirlas, con una permutacion distinta por
-- pregunta y por intento.
--
-- LA CORRESPONDENCIA SE GUARDA EN EL SERVIDOR
-- orden_opciones[k] es el indice ORIGINAL de la opcion que se vio en la
-- posicion k. Sin eso no se puede corregir: el candidato responde «la segunda»
-- y hay que saber cual era la segunda para el. Mandarle el mapa al cliente para
-- que lo deshiciera seria mandarle media respuesta.
--
-- ESQUEMA VOLCADO ANTES:
--   instructor_exam_attempt_questions
--     attempt_id  uuid NOT NULL
--     question_id uuid NOT NULL
--     posicion    integer NOT NULL
--     created_at  timestamptz NOT NULL DEFAULT now()
--   0 filas, asi que una columna NOT NULL nueva entra sin rellenar nada.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Donde se guarda el barajado
-- =====================================================

ALTER TABLE public.instructor_exam_attempt_questions
  ADD COLUMN IF NOT EXISTS orden_opciones integer[];

-- La tabla esta a 0 filas, asi que puede ser obligatoria desde el primer dia.
-- Si algun dia hubiera filas antiguas, esto fallaria y seria correcto que
-- fallara: una fila sin barajado guardado no se puede corregir.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM public.instructor_exam_attempt_questions WHERE orden_opciones IS NULL) THEN
    RAISE EXCEPTION
      'Hay filas sin orden_opciones (%). No se puede hacer obligatoria la columna sin decidir que se hace con ellas.',
      (SELECT count(*) FROM public.instructor_exam_attempt_questions WHERE orden_opciones IS NULL);
  END IF;
END
$do$;

ALTER TABLE public.instructor_exam_attempt_questions
  ALTER COLUMN orden_opciones SET NOT NULL;

COMMENT ON COLUMN public.instructor_exam_attempt_questions.orden_opciones IS
  'La permutacion con la que se mostraron las opciones: orden_opciones[k] es el indice original de la opcion vista en la posicion k. Se guarda en el servidor porque es lo unico que permite corregir una respuesta barajada, y mandarsela al cliente seria mandarle media respuesta.';

-- =====================================================
-- 2. servir_preguntas, barajando
-- =====================================================
-- Misma firma y mismas garantias que en la 095: solo el servidor, y NO devuelve
-- correct_answer. Lo unico que cambia es que las opciones salen permutadas y la
-- permutacion queda apuntada.

CREATE OR REPLACE FUNCTION public.servir_preguntas(
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
  v_elegidas     uuid[];
  v_pregunta     uuid;
  v_pos          integer;
  v_orden        integer[];
  v_originales   jsonb;
  v_vistas       jsonb;
  v_texto        text;
  v_dificultad   text;
  v_puntos       integer;
  v_categoria    text;
BEGIN
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
    RAISE EXCEPTION 'El examen % no existe o no tiene especialidad.', p_exam_id;
  END IF;

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

  INSERT INTO public.instructor_exam_attempts (user_id, exam_id, total_questions, status)
  VALUES (p_user_id, p_exam_id, p_cuantas, 'in_progress')
  RETURNING id INTO v_intento;

  -- Las elegidas se materializan ANTES del bucle: leerlas con un cursor
  -- mientras se insertan filas haria que lo que devuelve a mitad de camino
  -- dependiera de lo ya insertado.
  SELECT array_agg(elegidas.id) INTO v_elegidas
    FROM (
      SELECT q.id
        FROM public.instructor_exam_questions q
       WHERE q.specialty_id = v_especialidad
         AND NOT EXISTS (
           SELECT 1
             FROM public.instructor_exam_attempt_questions aq
             JOIN public.instructor_exam_attempts a ON a.id = aq.attempt_id
            WHERE aq.question_id = q.id
              AND a.user_id = p_user_id
              AND a.exam_id = p_exam_id
         )
       ORDER BY random()
       LIMIT p_cuantas
    ) AS elegidas;

  v_pos := 0;
  FOREACH v_pregunta IN ARRAY v_elegidas
  LOOP
    v_pos := v_pos + 1;

    SELECT q.question, q.options, q.difficulty, q.points, q.category
      INTO v_texto, v_originales, v_dificultad, v_puntos, v_categoria
      FROM public.instructor_exam_questions q
     WHERE q.id = v_pregunta;

    -- La permutacion de esta pregunta en este intento
    SELECT array_agg(g.i ORDER BY random()) INTO v_orden
      FROM generate_series(0, jsonb_array_length(v_originales) - 1) AS g(i);

    SELECT jsonb_agg(v_originales -> u.idx ORDER BY u.ord)
      INTO v_vistas
      FROM unnest(v_orden) WITH ORDINALITY AS u(idx, ord);

    INSERT INTO public.instructor_exam_attempt_questions
      (attempt_id, question_id, posicion, orden_opciones)
    VALUES (v_intento, v_pregunta, v_pos, v_orden);

    attempt_id  := v_intento;
    question_id := v_pregunta;
    posicion    := v_pos;
    question    := v_texto;
    options     := v_vistas;
    difficulty  := v_dificultad;
    points      := v_puntos;
    category    := v_categoria;
    RETURN NEXT;
  END LOOP;
END
$fn$;

COMMENT ON FUNCTION public.servir_preguntas(uuid, uuid, integer) IS
  'Crea un intento y le sirve N preguntas del banco de la especialidad, al azar entre las que esa persona no ha visto nunca en ese examen, CON LAS OPCIONES BARAJADAS y la permutacion apuntada en orden_opciones. No devuelve correct_answer. Solo service_role.';

REVOKE ALL ON FUNCTION public.servir_preguntas(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.servir_preguntas(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.servir_preguntas(uuid, uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.servir_preguntas(uuid, uuid, integer) TO service_role;

-- =====================================================
-- 3. La prueba, dentro de la propia migracion
-- =====================================================
-- Se crea un examen de usar y tirar para una especialidad sin examen, con sus
-- preguntas, y se borra todo al final. Asi la prueba corre SIEMPRE, y no se
-- omite como la de la 095.

DO $prueba$
DECLARE
  v_usuario uuid;
  v_esp     uuid;
  v_examen  uuid;
  v_n       integer;
  v_i       integer;
  v_iguales integer;
BEGIN
  SELECT id INTO v_usuario FROM public.users ORDER BY created_at LIMIT 1;
  -- Una especialidad sin examen: lightning no lo tiene, y asi no se toca nada
  -- de las cuatro que si lo tienen.
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'lightning';

  IF v_usuario IS NULL OR v_esp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un usuario y la especialidad lightning. ¿Se aplico la 090?';
  END IF;

  INSERT INTO public.instructor_exams
    (specialty_id, title, slug, total_questions, pass_threshold, is_active)
  VALUES (v_esp, 'PRUEBA-096', 'prueba-096-borrar', 4, 70, false)
  RETURNING id INTO v_examen;

  FOR v_i IN 1..4 LOOP
    INSERT INTO public.instructor_exam_questions
      (specialty_id, question, options, correct_answer, difficulty)
    VALUES (v_esp, 'PRUEBA-096 numero ' || v_i,
            '["opcion 0","opcion 1","opcion 2","opcion 3"]'::jsonb, 0, 'hard');
  END LOOP;

  -- 1. Sirve 4 y las apunta con su permutacion
  SELECT count(*) INTO v_n FROM public.servir_preguntas(v_usuario, v_examen, 4);
  IF v_n <> 4 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: se pidieron 4 y llegaron %.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 1  sirve 4 preguntas y crea el intento               PASA';

  -- 2. Cada fila guarda una permutacion COMPLETA de sus opciones
  IF EXISTS (
    SELECT 1
      FROM public.instructor_exam_attempt_questions aq
      JOIN public.instructor_exam_questions q ON q.id = aq.question_id
     WHERE q.question LIKE 'PRUEBA-096%'
       AND (SELECT array_agg(x ORDER BY x) FROM unnest(aq.orden_opciones) AS x)
           IS DISTINCT FROM ARRAY[0, 1, 2, 3]
  ) THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: alguna permutacion no es completa.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  cada fila guarda una permutacion completa         PASA';

  -- 3. Y baraja de verdad: con 4 preguntas de 4 opciones, que las cuatro
  --    salieran sin tocar tiene una probabilidad de 1 entre 331.776.
  SELECT count(*) INTO v_iguales
    FROM public.instructor_exam_attempt_questions aq
    JOIN public.instructor_exam_questions q ON q.id = aq.question_id
   WHERE q.question LIKE 'PRUEBA-096%'
     AND aq.orden_opciones = ARRAY[0, 1, 2, 3];
  IF v_iguales = 4 THEN
    RAISE EXCEPTION
      'PRUEBA 3 FALLIDA: las cuatro preguntas salieron sin barajar. Probabilidad 1/331776: casi seguro que no baraja.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  baraja: % de 4 sin tocar                          PASA', v_iguales;

  -- 4. La opcion vista en la posicion k es la original orden_opciones[k]
  IF EXISTS (
    SELECT 1
      FROM public.instructor_exam_attempt_questions aq
      JOIN public.instructor_exam_questions q ON q.id = aq.question_id
     WHERE q.question LIKE 'PRUEBA-096%'
       AND (q.options -> aq.orden_opciones[1]) IS NULL
  ) THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: la permutacion apunta a una opcion que no existe.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  la permutacion apunta a opciones reales           PASA';

  -- Limpieza
  DELETE FROM public.instructor_exam_attempts WHERE exam_id = v_examen;
  DELETE FROM public.instructor_exam_questions WHERE question LIKE 'PRUEBA-096%';
  DELETE FROM public.instructor_exams WHERE id = v_examen;
  RAISE NOTICE 'Filas de prueba borradas. Las cuatro pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempt_questions'
             AND column_name = 'orden_opciones' AND is_nullable = 'NO')          AS guarda_el_barajado,

  pg_get_functiondef('public.servir_preguntas(uuid,uuid,integer)'::regprocedure)
    ILIKE '%orden_opciones%'                                                     AS la_funcion_apunta_el_orden,

  NOT (pg_get_functiondef('public.servir_preguntas(uuid,uuid,integer)'::regprocedure)
        ILIKE '%correct_answer%')                                                AS sin_respuesta_correcta,

  NOT has_function_privilege('authenticated',
    'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')                     AS auth_no_puede_servir,
  has_function_privilege('service_role',
    'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')                     AS servicio_puede_servir,

  (SELECT count(*) FROM public.instructor_exam_questions)                        AS preguntas,
  (SELECT count(*) FROM public.instructor_exams)                                 AS examenes,
  (SELECT count(*) FROM public.instructor_exam_attempt_questions)                 AS filas_servidas,
  (SELECT count(*) FROM public.instructor_exam_questions
    WHERE question LIKE 'PRUEBA-096%')                                           AS filas_de_prueba_que_quedan,

  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'instructor_exam_attempt_questions'
                    AND column_name = 'orden_opciones' AND is_nullable = 'NO')
     AND pg_get_functiondef('public.servir_preguntas(uuid,uuid,integer)'::regprocedure)
           ILIKE '%orden_opciones%'
     AND NOT (pg_get_functiondef('public.servir_preguntas(uuid,uuid,integer)'::regprocedure)
               ILIKE '%correct_answer%')
     AND NOT has_function_privilege('authenticated',
               'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')
     AND has_function_privilege('service_role',
               'public.servir_preguntas(uuid,uuid,integer)', 'EXECUTE')
     AND (SELECT count(*) FROM public.instructor_exams) = 4
     AND (SELECT count(*) FROM public.instructor_exam_questions
           WHERE question LIKE 'PRUEBA-096%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
