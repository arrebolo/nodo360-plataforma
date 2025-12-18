-- =====================================================
-- DIAGNOSTICO Y LIMPIEZA DE LECCIONES DUPLICADAS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1) Ver todas las lecciones con slug duplicado
SELECT
  l.slug,
  COUNT(*) as num_duplicados,
  array_agg(l.id) as ids,
  array_agg(l.title) as titles,
  array_agg(m.title) as modulos
FROM lessons l
JOIN modules m ON m.id = l.module_id
GROUP BY l.slug
HAVING COUNT(*) > 1
ORDER BY num_duplicados DESC;

-- 2) Ver detalle de las lecciones duplicadas con info del curso
SELECT
  l.id,
  l.slug,
  l.title,
  l.order_index,
  l.created_at,
  m.title as modulo,
  c.title as curso,
  c.slug as curso_slug
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.slug IN (
  SELECT slug FROM lessons GROUP BY slug HAVING COUNT(*) > 1
)
ORDER BY l.slug, l.created_at DESC;

-- 3) Para limpiar un slug especifico: descomentar y ajustar
-- EJEMPLO: Eliminar duplicado de 'leccion-2-1' conservando el mas reciente
/*
DELETE FROM lessons
WHERE slug = 'leccion-2-1'
  AND id <> (
    SELECT l.id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE l.slug = 'leccion-2-1'
    ORDER BY l.created_at DESC
    LIMIT 1
  );
*/

-- 4) Limpiar TODOS los duplicados conservando el mas reciente de cada slug
-- ADVERTENCIA: Revisar primero con las consultas anteriores
/*
DELETE FROM lessons
WHERE id IN (
  SELECT l.id
  FROM lessons l
  WHERE EXISTS (
    SELECT 1 FROM lessons l2
    WHERE l2.slug = l.slug
      AND l2.created_at > l.created_at
  )
);
*/

-- 5) Prevenir futuros duplicados
-- Opcion A: Slug unico global (mas restrictivo)
-- ALTER TABLE lessons ADD CONSTRAINT lessons_slug_unique UNIQUE (slug);

-- Opcion B: Slug unico dentro de cada modulo (recomendado)
-- ALTER TABLE lessons ADD CONSTRAINT lessons_slug_module_unique UNIQUE (slug, module_id);

-- 6) Verificar despues de limpiar
SELECT
  l.slug,
  COUNT(*) as count
FROM lessons l
GROUP BY l.slug
HAVING COUNT(*) > 1;
