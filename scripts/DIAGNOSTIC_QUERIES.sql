-- ========================================
-- DIAGNÓSTICO DE SLUGS - NODO360 PLATAFORMA
-- ========================================
-- Ejecuta estas queries en Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/sql

-- ========================================
-- 1. LISTAR TODOS LOS CURSOS Y SUS SLUGS
-- ========================================
SELECT
  id,
  title,
  slug,
  status,
  CONCAT('/cursos/', slug) as url_esperada,
  created_at
FROM courses
ORDER BY id;

-- ========================================
-- 2. LISTAR TODAS LAS LECCIONES CON SLUGS DE CURSO
-- ========================================
SELECT
  l.id,
  c.title as curso_titulo,
  c.slug as curso_slug,
  l.title as leccion_titulo,
  l.slug as leccion_slug,
  l.status,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_esperada
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY c.id, m.order_index, l.order_index;

-- ========================================
-- 3. VERIFICAR URL ESPECÍFICA: /cursos/bitcoin-desde-cero/leccion-1-1
-- ========================================

-- 3a. ¿Existe el curso "bitcoin-desde-cero"?
SELECT
  id,
  title,
  slug,
  status,
  'CURSO ENCONTRADO ✅' as resultado
FROM courses
WHERE slug = 'bitcoin-desde-cero';

-- Si no hay resultados, muestra los slugs disponibles:
SELECT
  slug,
  title,
  'Slug disponible' as nota
FROM courses
WHERE status = 'published'
ORDER BY slug;

-- 3b. ¿Existe la lección "leccion-1-1" en el curso "bitcoin-desde-cero"?
SELECT
  l.id,
  l.title,
  l.slug,
  l.status,
  c.slug as curso_slug,
  'LECCIÓN ENCONTRADA ✅' as resultado
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
  AND l.slug = 'leccion-1-1';

-- Si no hay resultados, muestra las lecciones disponibles en ese curso:
SELECT
  l.slug as leccion_slug,
  l.title as leccion_titulo,
  m.title as modulo_titulo,
  l.order_index,
  'Slug disponible' as nota
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.slug = 'bitcoin-desde-cero'
ORDER BY m.order_index, l.order_index;

-- ========================================
-- 4. BUSCAR POSIBLES VARIACIONES DE SLUG
-- ========================================

-- Buscar cursos que contengan "bitcoin"
SELECT
  id,
  title,
  slug,
  'Coincidencia parcial con "bitcoin"' as nota
FROM courses
WHERE slug ILIKE '%bitcoin%'
   OR title ILIKE '%bitcoin%';

-- Buscar lecciones que contengan "leccion-1"
SELECT
  l.id,
  l.title,
  l.slug,
  c.slug as curso_slug,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_completa,
  'Coincidencia parcial con "leccion-1"' as nota
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE l.slug ILIKE '%leccion-1%'
   OR l.title ILIKE '%leccion 1%';

-- ========================================
-- 5. VERIFICAR INTEGRIDAD DE SLUGS
-- ========================================

-- Cursos sin slug o con slug vacío
SELECT
  id,
  title,
  slug,
  '⚠️ Slug vacío o NULL' as problema
FROM courses
WHERE slug IS NULL OR slug = '';

-- Lecciones sin slug o con slug vacío
SELECT
  l.id,
  l.title,
  l.slug,
  c.title as curso_titulo,
  '⚠️ Slug vacío o NULL' as problema
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE l.slug IS NULL OR l.slug = '';

-- Slugs duplicados en cursos
SELECT
  slug,
  COUNT(*) as cantidad,
  STRING_AGG(title, ', ') as cursos_afectados,
  '⚠️ Slug duplicado' as problema
FROM courses
GROUP BY slug
HAVING COUNT(*) > 1;

-- Slugs duplicados en lecciones del mismo curso
SELECT
  c.slug as curso_slug,
  l.slug as leccion_slug,
  COUNT(*) as cantidad,
  STRING_AGG(l.title, ', ') as lecciones_afectadas,
  '⚠️ Slug duplicado en mismo curso' as problema
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
GROUP BY c.slug, l.slug
HAVING COUNT(*) > 1;

-- ========================================
-- 6. GENERAR LISTA DE URLS VÁLIDAS (solo publicadas)
-- ========================================
SELECT
  'CURSO' as tipo,
  c.title,
  CONCAT('/cursos/', c.slug) as url_valida,
  c.status
FROM courses c
WHERE c.status = 'published'

UNION ALL

SELECT
  'LECCIÓN' as tipo,
  CONCAT(c.title, ' > ', l.title) as title,
  CONCAT('/cursos/', c.slug, '/', l.slug) as url_valida,
  l.status
FROM lessons l
JOIN modules m ON l.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE c.status = 'published' AND l.status = 'published'
ORDER BY tipo DESC, url_valida;
