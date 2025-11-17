-- ============================================================================
-- CLEANUP QUERIES - Limpieza de Contenido Corrupto en Lecciones
-- ============================================================================
-- Fecha: 2025-11-17
-- Propósito: Diagnosticar y limpiar lecciones con código TypeScript/JSX
--            mezclado en el contenido HTML
-- ============================================================================

-- ============================================================================
-- FASE 1: DIAGNÓSTICO
-- ============================================================================

-- Query 1.1: Identificar lecciones con código corrupto
SELECT
  l.id,
  l.slug,
  l.title,
  m.title as module_title,
  c.title as course_title,
  c.slug as course_slug,
  LENGTH(l.content) as content_length,
  CASE
    WHEN l.content LIKE '%import type%' THEN '🔴 TYPESCRIPT CODE'
    WHEN l.content LIKE '%export default%' THEN '🔴 JSX CODE'
    WHEN l.content LIKE '%function%Page()%' THEN '🔴 COMPONENT CODE'
    WHEN l.content IS NULL THEN '⚪ NULL'
    WHEN TRIM(l.content) = '' THEN '⚪ EMPTY'
    ELSE '✅ LOOKS OK'
  END as status,
  SUBSTRING(l.content, 1, 100) as preview
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
ORDER BY
  CASE
    WHEN l.content LIKE '%import type%' THEN 1
    WHEN l.content LIKE '%export default%' THEN 2
    WHEN l.content LIKE '%function%Page()%' THEN 3
    ELSE 4
  END,
  c.title,
  m.order_index,
  l.order_index;

-- Query 1.2: Contar lecciones por estado
SELECT
  COUNT(*) as total_lessons,
  COUNT(CASE WHEN content LIKE '%import type%' OR content LIKE '%export default%' THEN 1 END) as corrupted_lessons,
  COUNT(CASE WHEN content IS NULL OR TRIM(content) = '' THEN 1 END) as empty_lessons,
  COUNT(CASE WHEN content IS NOT NULL AND content NOT LIKE '%import%' AND content NOT LIKE '%export%' THEN 1 END) as ok_lessons
FROM lessons;

-- Query 1.3: Ver contenido completo de una lección específica
-- REEMPLAZAR 'leccion-1-1' y 'fundamentos-blockchain' con tus valores
SELECT
  l.id,
  l.slug,
  l.title,
  m.title as module_title,
  c.title as course_title,
  l.content,
  l.content_json,
  l.video_url,
  LENGTH(l.content) as content_length
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.slug = 'leccion-1-1'
  AND c.slug = 'fundamentos-blockchain';

-- Query 1.4: Listar SOLO lecciones corruptas con su URL
SELECT
  c.slug || '/modulos/' || m.slug || '/lecciones/' || l.slug as url,
  l.id,
  l.slug as lesson_slug,
  l.title,
  SUBSTRING(l.content, 1, 50) as preview
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.content LIKE '%import type%'
   OR l.content LIKE '%export default%'
   OR l.content LIKE '%function%Page()%'
ORDER BY c.slug, m.order_index, l.order_index;

-- ============================================================================
-- FASE 2: BACKUP
-- ============================================================================

-- Query 2.1: Crear tabla de backup
CREATE TABLE IF NOT EXISTS lessons_backup AS
SELECT * FROM lessons;

-- Query 2.2: Verificar backup
SELECT COUNT(*) as total_lessons_backed_up
FROM lessons_backup;

-- Query 2.3: Comparar original vs backup
SELECT
  (SELECT COUNT(*) FROM lessons) as original_count,
  (SELECT COUNT(*) FROM lessons_backup) as backup_count,
  CASE
    WHEN (SELECT COUNT(*) FROM lessons) = (SELECT COUNT(*) FROM lessons_backup)
    THEN '✅ BACKUP OK'
    ELSE '❌ BACKUP INCOMPLETO'
  END as status;

-- ============================================================================
-- FASE 3: LIMPIEZA - OPCIÓN A (MANUAL, RECOMENDADO)
-- ============================================================================

-- Query 3A.1: Ver contenido de UNA lección para limpiar
-- REEMPLAZAR 'leccion-1-1' con el slug que quieras limpiar
SELECT
  id,
  slug,
  title,
  content
FROM lessons
WHERE slug = 'leccion-1-1';

-- Query 3A.2: Actualizar UNA lección con contenido limpio
-- REEMPLAZAR con el slug y el HTML limpio
UPDATE lessons
SET
  content = '<div class="container mx-auto px-4 py-8">
  <h1>Tu contenido HTML limpio aquí</h1>
  <p>Sin imports, exports ni código TypeScript</p>
</div>',
  updated_at = NOW()
WHERE slug = 'leccion-1-1'
  AND id IN (
    SELECT l.id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'fundamentos-blockchain'  -- REEMPLAZAR con tu course slug
  );

-- Query 3A.3: Verificar la actualización
SELECT
  slug,
  SUBSTRING(content, 1, 200) as content_preview,
  updated_at
FROM lessons
WHERE slug = 'leccion-1-1';

-- ============================================================================
-- FASE 3: LIMPIEZA - OPCIÓN B (MARCAR COMO NULL)
-- ============================================================================

-- Query 3B.1: Marcar lecciones corruptas como NULL (preparar para recrear)
-- ⚠️ EJECUTAR SOLO SI ESTÁS SEGURO
UPDATE lessons
SET
  content = NULL,
  updated_at = NOW()
WHERE content LIKE '%import type%'
   OR content LIKE '%export default%'
   OR content LIKE '%function%Page()%';

-- Query 3B.2: Verificar cuántas se marcaron como NULL
SELECT COUNT(*) as lessons_marked_null
FROM lessons
WHERE content IS NULL;

-- Query 3B.3: Listar lecciones NULL para rellenar manualmente
SELECT
  c.title as course,
  m.title as module,
  l.title as lesson,
  l.slug,
  CASE
    WHEN l.video_url IS NOT NULL THEN '✅ Tiene video'
    ELSE '⚪ Sin video'
  END as has_video
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.content IS NULL
ORDER BY c.slug, m.order_index, l.order_index;

-- ============================================================================
-- FASE 4: VERIFICACIÓN POST-LIMPIEZA
-- ============================================================================

-- Query 4.1: Verificar que NO queden lecciones con código
SELECT COUNT(*) as remaining_corrupted_lessons
FROM lessons
WHERE content LIKE '%import type%'
   OR content LIKE '%export default%'
   OR content LIKE '%function%Page()%';

-- Resultado esperado: 0

-- Query 4.2: Ver estado final de todas las lecciones
SELECT
  c.title as course,
  m.title as module,
  l.title as lesson,
  l.slug,
  CASE
    WHEN l.content IS NULL THEN '⚪ NULL'
    WHEN TRIM(l.content) = '' THEN '⚪ EMPTY'
    WHEN l.content_json IS NOT NULL THEN '✨ JSON (nuevo sistema)'
    WHEN LENGTH(l.content) > 50 THEN '✅ HAS CONTENT'
    ELSE '⚠️ SHORT CONTENT'
  END as status,
  LENGTH(l.content) as content_length
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
ORDER BY c.slug, m.order_index, l.order_index;

-- Query 4.3: Verificar que las lecciones tengan metadata correcta
SELECT
  c.slug as course_slug,
  l.slug as lesson_slug,
  l.title,
  l.video_url IS NOT NULL as has_video,
  l.content IS NOT NULL as has_content,
  l.content_json IS NOT NULL as has_json,
  CASE
    WHEN l.video_url IS NOT NULL OR l.content IS NOT NULL OR l.content_json IS NOT NULL
    THEN '✅ OK'
    ELSE '❌ NO CONTENT'
  END as status
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
ORDER BY c.slug, m.order_index, l.order_index;

-- ============================================================================
-- FASE 5: ROLLBACK (SI ALGO SALE MAL)
-- ============================================================================

-- Query 5.1: Restaurar UNA lección desde backup
-- REEMPLAZAR 'LESSON_ID' con el ID de la lección
UPDATE lessons
SET
  content = (SELECT content FROM lessons_backup WHERE id = 'LESSON_ID'),
  updated_at = NOW()
WHERE id = 'LESSON_ID';

-- Query 5.2: Restaurar TODAS las lecciones desde backup
-- ⚠️ CUIDADO: Esto deshace TODOS los cambios
UPDATE lessons
SET
  content = lessons_backup.content,
  updated_at = NOW()
FROM lessons_backup
WHERE lessons.id = lessons_backup.id;

-- Query 5.3: Eliminar tabla de backup (solo después de verificar que todo está OK)
-- DROP TABLE IF EXISTS lessons_backup;

-- ============================================================================
-- QUERIES ÚTILES ADICIONALES
-- ============================================================================

-- Query X.1: Buscar lecciones por curso
SELECT
  l.id,
  l.slug,
  l.title,
  LENGTH(l.content) as content_length
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE c.slug = 'fundamentos-blockchain'  -- REEMPLAZAR
ORDER BY m.order_index, l.order_index;

-- Query X.2: Encontrar lecciones con className (JSX) en lugar de class (HTML)
SELECT
  l.slug,
  l.title,
  CASE
    WHEN l.content LIKE '%className=%' THEN '⚠️ Tiene className (JSX)'
    ELSE '✅ OK'
  END as status
FROM lessons l
WHERE l.content LIKE '%className=%';

-- Query X.3: Limpiar className → class (si existe)
-- ⚠️ Solo ejecutar si Query X.2 encontró resultados
UPDATE lessons
SET
  content = REPLACE(content, 'className=', 'class='),
  updated_at = NOW()
WHERE content LIKE '%className=%';

-- Query X.4: Ver lecciones recientemente actualizadas
SELECT
  l.slug,
  l.title,
  l.updated_at,
  SUBSTRING(l.content, 1, 100) as preview
FROM lessons l
ORDER BY l.updated_at DESC
LIMIT 10;

-- ============================================================================
-- EJEMPLO COMPLETO: Lección 1.1 de Fundamentos de Blockchain
-- ============================================================================

-- PASO 1: Ver contenido actual
SELECT id, slug, title, content
FROM lessons
WHERE slug = 'leccion-1-1'
  AND id IN (
    SELECT l.id FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'fundamentos-blockchain'
  );

-- PASO 2: Actualizar con contenido limpio
-- (Después de extraer el HTML manualmente)
UPDATE lessons
SET content = '<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-4">Introducción a Blockchain</h1>
  <p class="mb-4">
    Blockchain es una tecnología revolucionaria...
  </p>
  <h2 class="text-2xl font-bold mb-3">¿Qué es un bloque?</h2>
  <p>
    Un bloque contiene información...
  </p>
</div>',
updated_at = NOW()
WHERE slug = 'leccion-1-1'
  AND id IN (
    SELECT l.id FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'fundamentos-blockchain'
  );

-- PASO 3: Verificar
SELECT slug, SUBSTRING(content, 1, 200)
FROM lessons
WHERE slug = 'leccion-1-1';

-- ============================================================================
-- NOTAS FINALES
-- ============================================================================

-- 1. Siempre haz BACKUP antes de UPDATE masivos
-- 2. Prueba queries en UNA lección primero
-- 3. Verifica en el navegador después de cada UPDATE
-- 4. Guarda esta query para referencia futura
-- 5. Considera migrar a content_json a largo plazo

-- ============================================================================
-- FIN DE QUERIES
-- ============================================================================
