-- ============================================================================
-- 035: cuatro correcciones ortográficas en contenido visible
--
-- VERSIONADO A POSTERIORI
-- Los cambios se aplicaron el 22/09/2026 vía PostgREST con la clave de
-- servicio, leyendo el texto de un archivo UTF-8 (regla 11). Esta migración
-- deja constancia y sirve para reproducir el mismo estado, como exige la
-- regla 4.
--
-- QUÉ SE CORRIGE
--   1. Una palabra truncada en el quiz de "Seguridad básica en Bitcoin y
--      criptomonedas": "Tu conexión a interne" -> "internet".
--   2. y 3. y 4. Tres tildes en learning_paths, visibles en /rutas.
--
-- SOBRE LA PALABRA TRUNCADA
-- No la causó la corrección de tildes del 21/09. Se comparó el contenido
-- actual con el respaldo previo a esa pasada, campo a campo y palabra a
-- palabra: 56 campos cambiaron, 75 cambios eran solo tildes, eñes o signos de
-- apertura, y ninguno perdía o alteraba letras. La truncadura ya estaba en el
-- respaldo, o sea que es anterior.
--
-- Un corrector ortográfico no la detecta, porque "interne" es una forma válida
-- del verbo internar. Se encontró comparando frecuencias dentro del propio
-- corpus: "interne" aparecía 1 vez frente a 45 de "internet".
--
-- LOS SLUGS NO SE TOCAN
-- learning_paths.slug sigue siendo 'bitcoin-tecnico', sin tilde: es una URL
-- publicada. Solo cambia el nombre que se muestra.
--
-- IDEMPOTENTE
-- Cada UPDATE lleva en el WHERE el texto que espera encontrar. Aplicada dos
-- veces, la segunda afecta a 0 filas. Y si el texto no es el esperado, no
-- escribe nada en lugar de pisar algo distinto.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. quiz_questions: "interne" -> "internet"
--
--    options es un array JSON. Se reemplaza el elemento concreto por su valor
--    corregido, sin tocar los demás ni el orden: la posición de la respuesta
--    correcta depende de ese orden.
-- ----------------------------------------------------------------------------

UPDATE public.quiz_questions q
   SET options = jsonb_set(
         q.options::jsonb,
         ARRAY[(idx - 1)::TEXT],
         to_jsonb('Tu conexión a internet'::TEXT)
       )::json
  FROM (
    SELECT qq.id AS qid, o.ord AS idx
      FROM public.quiz_questions qq
      CROSS JOIN LATERAL jsonb_array_elements_text(qq.options::jsonb)
           WITH ORDINALITY AS o(valor, ord)
     WHERE o.valor = 'Tu conexión a interne'
  ) f
 WHERE q.id = f.qid;

-- ----------------------------------------------------------------------------
-- 2, 3 y 4. learning_paths
-- ----------------------------------------------------------------------------

UPDATE public.learning_paths
   SET short_description = 'Aprende a proteger tus fondos con técnicas avanzadas de custodia y seguridad.'
 WHERE slug = 'seguridad-avanzada'
   AND short_description = 'Aprende a proteger tus fondos con tecnicas avanzadas de custodia y seguridad.';

UPDATE public.learning_paths
   SET name = 'Bitcoin Técnico'
 WHERE slug = 'bitcoin-tecnico'
   AND name = 'Bitcoin Tecnico';

UPDATE public.learning_paths
   SET short_description = 'Entiende cómo funciona Bitcoin por dentro y aprende a participar activamente en la red.'
 WHERE slug = 'bitcoin-tecnico'
   AND short_description = 'Entiende como funciona Bitcoin por dentro y aprende a participar activamente en la red.';

COMMIT;


-- ============================================================================
-- VERIFICACIÓN. Solo lectura. Las cuatro filas deben decir CORRECTO.
-- ============================================================================

SELECT 1 AS n, 'quiz: la opcion dice internet' AS comprobacion,
       CASE WHEN EXISTS (
              SELECT 1 FROM public.quiz_questions qq
              CROSS JOIN LATERAL jsonb_array_elements_text(qq.options::jsonb) AS v(valor)
               WHERE v.valor = 'Tu conexión a internet')
            AND NOT EXISTS (
              SELECT 1 FROM public.quiz_questions qq
              CROSS JOIN LATERAL jsonb_array_elements_text(qq.options::jsonb) AS v(valor)
               WHERE v.valor = 'Tu conexión a interne')
            THEN 'CORRECTO' ELSE 'FALLO' END AS veredicto
UNION ALL
SELECT 2, 'ruta seguridad-avanzada: tecnicas con tilde',
       CASE WHEN short_description LIKE '%técnicas%' THEN 'CORRECTO' ELSE 'FALLO' END
  FROM public.learning_paths WHERE slug = 'seguridad-avanzada'
UNION ALL
SELECT 3, 'ruta bitcoin-tecnico: nombre con tilde, slug sin ella',
       CASE WHEN name = 'Bitcoin Técnico' AND slug = 'bitcoin-tecnico'
            THEN 'CORRECTO' ELSE 'FALLO' END
  FROM public.learning_paths WHERE slug = 'bitcoin-tecnico'
UNION ALL
SELECT 4, 'ruta bitcoin-tecnico: como funciona con tilde',
       CASE WHEN short_description LIKE '%cómo funciona%' THEN 'CORRECTO' ELSE 'FALLO' END
  FROM public.learning_paths WHERE slug = 'bitcoin-tecnico'
 ORDER BY n;
