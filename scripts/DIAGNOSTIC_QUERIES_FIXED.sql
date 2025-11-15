-- ========================================
-- DIAGNÓSTICO URGENTE - CORREGIDO SIN COLUMNA STATUS
-- ========================================
-- Ejecuta estas queries en Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/sql

-- ========================================
-- 1. VERIFICAR CURSO "bitcoin-desde-cero"
-- ========================================
SELECT
  id,
  title,
  slug,
  status,
  '✅ CURSO ENCONTRADO' as resultado
FROM courses
WHERE slug = 'bitcoin-desde-cero';

-- Si no devuelve resultados, ejecuta esto para ver cursos disponibles:
-- SELECT slug, title FROM courses ORDER BY slug;

-- ========================================
-- 2. LISTAR TODAS LAS LECCIONES DEL CURSO "bitcoin-desde-cero"
-- ========================================
SELECT
  l.id,
  l.title,
  l.slug,
  l.order_index,
  m.title as modulo_titulo,
  m.order_index as modulo_order,
  CONCAT('/cursos/bitcoin-desde-cero/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
ORDER BY m.order_index, l.order_index;

-- ========================================
-- 3. BUSCAR LECCIÓN "leccion-1-1" ESPECÍFICAMENTE
-- ========================================
SELECT
  l.id,
  l.title,
  l.slug,
  c.slug as curso_slug,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_completa,
  '✅ LECCIÓN ENCONTRADA' as resultado
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
  AND l.slug = 'leccion-1-1';

-- ========================================
-- 4. BUSCAR LECCIONES CON SLUG SIMILAR A "leccion-1"
-- ========================================
SELECT
  l.id,
  l.title,
  l.slug,
  c.slug as curso_slug,
  m.order_index as modulo_order,
  l.order_index as leccion_order,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
  AND (l.slug ILIKE '%leccion-1%' OR l.slug ILIKE '%1-1%' OR l.slug ILIKE '%1.1%')
ORDER BY m.order_index, l.order_index;

-- ========================================
-- 5. CONTAR LECCIONES POR CURSO
-- ========================================
SELECT
  c.slug as curso_slug,
  c.title as curso_titulo,
  COUNT(l.id) as total_lecciones
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
GROUP BY c.id, c.slug, c.title
ORDER BY c.slug;

-- ========================================
-- 6. LISTAR TODOS LOS SLUGS DE LECCIONES (TODAS)
-- ========================================
SELECT
  c.slug as curso_slug,
  m.title as modulo_titulo,
  l.slug as leccion_slug,
  l.title as leccion_titulo,
  l.order_index,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_completa
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY c.slug, m.order_index, l.order_index;

-- ========================================
-- CORRECCIONES SQL (EJECUTAR SOLO SI ES NECESARIO)
-- ========================================

-- CASO 1: Si la lección existe pero con slug diferente
-- Ejemplo: el slug real es "1-1" pero necesitas "leccion-1-1"
/*
UPDATE lessons
SET slug = 'leccion-1-1'
WHERE id = 'REEMPLAZA_CON_ID_DE_LA_LECCION';
*/

-- CASO 2: Si el curso existe pero con slug diferente
-- Ejemplo: el slug real es "bitcoin-101" pero necesitas "bitcoin-desde-cero"
/*
UPDATE courses
SET slug = 'bitcoin-desde-cero'
WHERE id = 'REEMPLAZA_CON_ID_DEL_CURSO';
*/

-- CASO 3: Actualizar múltiples slugs de lecciones a la vez
-- Ejemplo: cambiar formato "1-1" a "leccion-1-1"
/*
UPDATE lessons l
SET slug = CONCAT('leccion-', l.slug)
FROM modules m, courses c
WHERE l.module_id = m.id
  AND m.course_id = c.id
  AND c.slug = 'bitcoin-desde-cero'
  AND l.slug NOT LIKE 'leccion-%';
*/

-- CASO 4: Verificar que el curso esté publicado
/*
UPDATE courses
SET status = 'published'
WHERE slug = 'bitcoin-desde-cero'
  AND status != 'published';
*/
