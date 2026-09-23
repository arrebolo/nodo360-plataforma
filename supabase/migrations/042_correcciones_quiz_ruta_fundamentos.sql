-- Migracion 042: tres correcciones en el quiz de la ruta Fundamentos de Bitcoin
--
-- Detectadas en la auditoria de la ruta del 23/09/2026. Son arreglos de datos
-- publicados, independientes de la reescritura de contenido que viene despues.
--
-- 1. RESPUESTA MAL MARCADA (defecto en produccion)
--    "Fundamentos de Bitcoin" > "¿En que contexto historico surge Bitcoin?"
--    tenia correct_answer = 0, que apunta a "Durante el auge de las redes
--    sociales". La respuesta correcta es la crisis financiera de 2008, que es
--    justamente lo que ensena la leccion 1.3 de ese mismo curso, "El contexto
--    previo a Bitcoin". Quien seguia el curso suspendia esa pregunta.
--    Pasa a correct_answer = 1.
--
-- 2. ERRATA
--    "Uso practico de Bitcoin" > "¿Que ocurre realmente cuando envias Bitcoin?"
--    tenia una opcion "e bloquea el saldo temporalmente", sin la S inicial.
--
-- 3. FORMATO INCONSISTENTE
--    Las 5 preguntas de "Fundamentos de Bitcoin" llevaban los prefijos "A) ",
--    "B) "... incrustados en el texto de cada opcion. Las 15 preguntas de los
--    otros tres cursos de la ruta no los llevan, y la interfaz ya numera las
--    opciones por su cuenta, asi que se veian duplicados. Se quitan.
--    Quitar el prefijo no altera el orden, de modo que correct_answer sigue
--    siendo valido en las cuatro preguntas que ya estaban bien.
--
-- Respaldo previo: C:\Users\alber\042-volver-atras.sql restaura options y
-- correct_answer de las 10 preguntas de los dos cursos al estado anterior.

BEGIN;

-- 1. La respuesta correcta es la crisis de 2008 (indice 1), no las redes
--    sociales (indice 0).
UPDATE public.quiz_questions
SET correct_answer = 1
WHERE id = '6d582e1e-f472-4131-bacb-6539c6ed4f5c'
  AND correct_answer = 0;

-- 2. La errata de la opcion sin S inicial.
UPDATE public.quiz_questions
--    Se toca solo esa opcion, con jsonb_set, en vez de reescribir el array
--    entero: las otras tres llevan tildes y no hay que arriesgarse a perderlas.
SET options = jsonb_set(options, '{3}', '"Se bloquea el saldo temporalmente"'::jsonb)
WHERE id = 'a71251cc-4c4b-4e48-8d16-a96a16a25401'
  AND options #>> '{3}' = 'e bloquea el saldo temporalmente';

-- 3. Los prefijos "A) ".."D) " de las 5 preguntas de Fundamentos de Bitcoin.
--    Se recorre el array y se recorta el prefijo de cada elemento, en vez de
--    reescribir los textos a mano: asi no se puede colar una errata nueva.
UPDATE public.quiz_questions q
SET options = (
  SELECT jsonb_agg(
    to_jsonb(regexp_replace(elem #>> '{}', '^[A-D]\)\s*', ''))
    ORDER BY idx
  )
  FROM jsonb_array_elements(q.options) WITH ORDINALITY AS t(elem, idx)
)
WHERE q.module_id IN (
  SELECT m.id
  FROM public.modules m
  JOIN public.courses c ON c.id = m.course_id
  WHERE c.slug = 'fundamentos-de-bitcoin'
)
AND EXISTS (
  SELECT 1
  FROM jsonb_array_elements(q.options) AS e(elem)
  WHERE elem #>> '{}' ~ '^[A-D]\)\s'
);

COMMIT;

-- Comprobaciones esperadas despues de aplicar:
--
--   a) La pregunta del contexto historico apunta a 2008:
--      SELECT correct_answer, options -> correct_answer
--      FROM public.quiz_questions
--      WHERE id = '6d582e1e-f472-4131-bacb-6539c6ed4f5c';
--      -> 1  |  "Tras la crisis financiera global de 2008"
--
--   b) No queda ninguna opcion con prefijo en toda la tabla:
--      SELECT count(*) FROM public.quiz_questions q
--      WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(q.options) AS e(elem)
--                    WHERE elem #>> '{}' ~ '^[A-D]\)\s');
--      -> 0
--
--   c) No queda la errata:
--      SELECT count(*) FROM public.quiz_questions
--      WHERE options::text LIKE '%"e bloquea%';
--      -> 0
--
--   d) Las 91 preguntas siguen teniendo 4 opciones y un correct_answer valido:
--      SELECT count(*) FROM public.quiz_questions
--      WHERE jsonb_array_length(options) <> 4
--         OR correct_answer < 0
--         OR correct_answer >= jsonb_array_length(options);
--      -> 0
