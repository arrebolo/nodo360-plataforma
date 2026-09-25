-- ============================================================================
-- 057: corrige un titulo de curso mal citado en seis lecciones
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   Seis lecciones publicadas citaban el curso de nodos como
--
--     Nodos Bitcoin — Tu Soberania Tecnica      (raya, U+2014)
--
--   y el titulo real es
--
--     Nodos Bitcoin - Tu Soberania Tecnica      (guion, U+002D)
--
--   No es una remision muerta: el lector entiende a que curso se refiere y
--   llega igual. Es una cita falsa, y el catalogo mezcla los dos signos en sus
--   propios titulos -"Cold Storage — Protege tus Bitcoin" si lleva raya-, asi
--   que a ojo no se distingue y el script de remisiones no lo veia.
--
-- DE DONDE SALIO
--   De la revision de la 056. Cinco de las seis lecciones son anteriores a
--   este trabajo: el error venia arrastrandose.
--
-- LAS SEIS, POR ID (los slug de leccion no son unicos entre cursos)
--   como-funciona-bitcoin-nivel-basico / descentralizacion-que-significa-realmente
--   como-funciona-bitcoin-nivel-basico / la-red-bitcoin-explicada-de-forma-sencilla
--   fundamentos-de-bitcoin             / limites-y-criticas-a-bitcoin
--   uso-practico-de-bitcoin            / expectativas-realistas-al-usar-bitcoin
--   fundamentos-blockchain             / como-leer-una-cadena-nueva
--   ethereum-y-contratos-inteligentes  / como-leer-un-contrato
--
-- LO QUE SE HIZO PARA QUE NO VUELVA A PASAR
--   scripts/comprobar-remisiones.mjs tiene una comprobacion nueva: un titulo
--   citado en cursiva que, normalizando los guiones, coincide con un curso
--   publicado pero no se escribe igual, se marca como "titulo MAL CITADO".
--   Probada en seis casos, incluidos los dos que deben callar (la abreviatura
--   "Blockchain" y el enfasis normal).
--
-- POR QUE NO VA EN LA 056
--   La 056 solo crea. Esto modifica cinco cursos que no tienen nada que ver
--   con Ethereum, y mezclarlo habria hecho ilegible el respaldo de la 056.
--
-- RESPALDO
--   No hace falta uno aparte: el cambio es reversible con el UPDATE inverso,
--   que esta al final del archivo comentado.
-- ============================================================================

BEGIN;

-- El disparador de la 030 mira columnas de courses, no de lessons, asi que
-- esto no deberia desencadenarlo. Se pone igual por si acaso (regla 22).
SET LOCAL app.skip_republish_check = 'on';

UPDATE public.lessons
   SET content = replace(content,
         'Nodos Bitcoin ' || U&'\2014' || ' Tu Soberanía Técnica',
         'Nodos Bitcoin - Tu Soberanía Técnica'),
       updated_at = now()
 WHERE content LIKE '%Nodos Bitcoin ' || U&'\2014' || ' Tu Soberanía Técnica%';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. No debe quedar ninguna
--
-- SELECT count(*) FROM public.lessons
--  WHERE content LIKE '%Nodos Bitcoin ' || U&'\2014' || '%';
-- QUE DEBE SALIR: 0.
--
-- 2. Y las seis deben citarlo bien
--
-- SELECT c.slug AS curso, l.slug AS leccion
--   FROM public.lessons l JOIN public.courses c ON c.id = l.course_id
--  WHERE l.content LIKE '%Nodos Bitcoin - Tu Soberanía Técnica%'
--  ORDER BY c.slug, l.slug;
-- QUE DEBE SALIR: 6 filas.
--
-- 3. Y ningun curso se ha despublicado por el camino
--
-- SELECT slug, status FROM public.courses WHERE status <> 'published'
--    AND slug IN ('como-funciona-bitcoin-nivel-basico', 'fundamentos-de-bitcoin',
--                 'uso-practico-de-bitcoin', 'fundamentos-blockchain',
--                 'ethereum-y-contratos-inteligentes');
-- QUE DEBE SALIR: 0 filas.


-- ============================================================================
-- VOLVER ATRAS (no deberia hacer falta: esto corrige un error)
-- ============================================================================
-- UPDATE public.lessons
--    SET content = replace(content,
--          'Nodos Bitcoin - Tu Soberanía Técnica',
--          'Nodos Bitcoin ' || U&'\2014' || ' Tu Soberanía Técnica')
--  WHERE content LIKE '%Nodos Bitcoin - Tu Soberanía Técnica%';
