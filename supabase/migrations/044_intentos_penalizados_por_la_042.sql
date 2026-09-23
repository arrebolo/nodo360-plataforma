-- Migracion 044: corrige los intentos de quiz penalizados por el defecto que
-- arreglo la 042.
--
-- Aplicada a mano el 24/09/2026 y versionada despues con el SQL exacto.
--
-- CONTEXTO
--
--   La pregunta "¿En que contexto historico surge Bitcoin?" del modulo "El
--   problema del dinero" tuvo correct_answer = 0 desde su creacion, lo que
--   apuntaba a "Durante el auge de las redes sociales". La 042 lo corrigio a 1,
--   la crisis financiera de 2008, que es lo que ensena la leccion 1.3 de ese
--   mismo curso.
--
--   Mientras estuvo mal, cuatro personas hicieron el quiz. Dos respondieron
--   2008 y quedaron con correct:false y 80 puntos en vez de 100. Esta migracion
--   les devuelve la puntuacion que les correspondia.
--
-- QUE SE TOCA Y QUE NO
--
--   bbe7a44f (20/01/2026)  respondio 1 -> se corrige, 80 -> 100
--   8ab8708c (21/01/2026)  respondio 1 -> se corrige, 80 -> 100
--
--   09d90b2b (15/01/2026)  respondio 0 y se le dio por buena. NO se toca:
--                          rebajarle la nota a posteriori castigaria a quien no
--                          tuvo culpa del fallo.
--   d31cf0dd (13/05/2026)  respondio 0, tambien dada por buena, y ademas fallo
--                          otra pregunta. NO se toca, por lo mismo.
--
--   La asimetria es deliberada: se repara a quien perdio puntos por el defecto
--   y no se penaliza a quien se beneficio de el.
--
-- Las dos filas corregidas pasan a 5/5, asi que score queda en 100 y passed no
-- cambia: las cuatro ya aprobaban.
--
-- Respaldo previo: C:\Users\alber\044-volver-atras.sql, con los 4 intentos del
-- modulo y ademas el slug de las 6 lecciones de "Como funciona Bitcoin". Lo
-- segundo por una leccion aprendida: el respaldo de la 043 restauraba title y
-- content pero no slug, y al ejecutarlo por error quedaron slugs nuevos sobre
-- contenido viejo, con cinco URLs sirviendo la leccion equivocada.

BEGIN;

-- 20/01/2026. La guarda del WHERE evita reaplicarlo si ya estuviera corregido.
UPDATE public.quiz_attempts
SET
  answers = jsonb_set(
    answers,
    ARRAY[(
      SELECT (idx - 1)::text
      FROM jsonb_array_elements(answers) WITH ORDINALITY AS t(elem, idx)
      WHERE elem ->> 'question_id' = '6d582e1e-f472-4131-bacb-6539c6ed4f5c'
    ), 'correct'],
    'true'::jsonb
  ),
  correct_answers = 5,
  score = 100
WHERE id = 'bbe7a44f-9af0-4848-bf7d-2978a3fdac0a'
  AND correct_answers = 4;

-- 21/01/2026
UPDATE public.quiz_attempts
SET
  answers = jsonb_set(
    answers,
    ARRAY[(
      SELECT (idx - 1)::text
      FROM jsonb_array_elements(answers) WITH ORDINALITY AS t(elem, idx)
      WHERE elem ->> 'question_id' = '6d582e1e-f472-4131-bacb-6539c6ed4f5c'
    ), 'correct'],
    'true'::jsonb
  ),
  correct_answers = 5,
  score = 100
WHERE id = '8ab8708c-7ff2-4054-9366-5fe3e34f688a'
  AND correct_answers = 4;

COMMIT;

-- SELECCION SIN DEPENDER DEL ID
--
--   Los dos UPDATE van por id porque es lo mas directo, pero la condicion de
--   fondo es esta, y sirve si alguna vez hay que repetir el ejercicio:
--
--     WHERE correct_answers = 4
--       AND EXISTS (
--         SELECT 1 FROM jsonb_array_elements(answers) AS e(elem)
--         WHERE elem ->> 'question_id' = '6d582e1e-f472-4131-bacb-6539c6ed4f5c'
--           AND (elem ->> 'selected_answer')::int = 1
--           AND (elem ->> 'correct')::boolean = false
--       )
--
-- COMPROBACIONES ESPERADAS DESPUES DE APLICAR
--
--   a) Solo cambian dos filas de las cuatro del modulo:
--      bbe7a44f y 8ab8708c -> score 100, correct_answers 5
--      09d90b2b -> sigue en 100 y 5;  d31cf0dd -> sigue en 80 y 4
--
--   b) quiz_attempts conserva sus 15 filas.
--
--   c) Los dos corregidos apuntan a la misma opcion que la pregunta marca hoy
--      como correcta (indice 1, la crisis de 2008).
--
--   Verificado el 24/09/2026: 2 filas cambiadas, 15 filas en la tabla, y los
--   dos corregidos coherentes con correct_answer = 1.
