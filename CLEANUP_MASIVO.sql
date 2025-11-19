-- ============================================================================
-- LIMPIEZA MASIVA DE LECCIONES CORRUPTAS
-- ============================================================================
-- Fecha: 2025-11-17
-- Propósito: Limpiar TODAS las lecciones que contienen código TypeScript/JSX
--            en lugar de contenido HTML puro
-- Estrategia: Marcar como NULL y rellenar manualmente después
-- ============================================================================

-- ⚠️ IMPORTANTE: EJECUTAR LAS QUERIES EN ORDEN
-- ⚠️ NO SALTARSE EL BACKUP (PASO 1)
-- ⚠️ LEER CADA COMENTARIO ANTES DE EJECUTAR

-- ============================================================================
-- PASO 0: DIAGNÓSTICO INICIAL
-- ============================================================================
-- Ejecuta estas queries PRIMERO para entender la magnitud del problema

-- Query 0.1: Resumen general del estado de las lecciones
SELECT
  COUNT(*) as total_lecciones,
  COUNT(CASE WHEN content LIKE '%import%' OR content LIKE '%export%' THEN 1 END) as con_codigo_typescript,
  COUNT(CASE WHEN content IS NULL OR TRIM(content) = '' THEN 1 END) as vacias,
  COUNT(CASE WHEN content_json IS NOT NULL THEN 1 END) as con_json,
  COUNT(CASE WHEN content IS NOT NULL
             AND content NOT LIKE '%import%'
             AND content NOT LIKE '%export%' THEN 1 END) as con_html_limpio
FROM lessons;

-- Resultado esperado: Ver cuántas lecciones tienen código vs HTML limpio


-- Query 0.2: Listar TODAS las lecciones con código TypeScript/JSX
SELECT
  c.slug as curso_slug,
  c.title as curso,
  m.order_index as modulo_num,
  m.title as modulo,
  l.order_index as leccion_num,
  l.slug as leccion_slug,
  l.title as leccion,
  CASE
    WHEN l.content LIKE '%import type%' THEN '🔴 TYPESCRIPT IMPORTS'
    WHEN l.content LIKE '%export default function%' THEN '🔴 COMPONENT CODE'
    WHEN l.content LIKE '%from ''next''%' THEN '🔴 NEXT.JS IMPORTS'
    WHEN l.content LIKE '%from ''react''%' THEN '🔴 REACT IMPORTS'
    ELSE '🔴 OTHER CODE'
  END as tipo_codigo,
  LENGTH(l.content) as longitud_contenido,
  SUBSTRING(l.content, 1, 100) as preview
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE
  l.content LIKE '%import%'
  OR l.content LIKE '%export%'
  OR l.content LIKE '%export default function%'
  OR l.content LIKE '%from ''next''%'
  OR l.content LIKE '%from ''react''%'
ORDER BY
  c.slug,
  m.order_index,
  l.order_index;

-- Guarda este resultado para saber qué lecciones necesitarás rellenar después


-- Query 0.3: Estadísticas por curso
SELECT
  c.title as curso,
  COUNT(*) as total_lecciones,
  SUM(CASE WHEN l.content LIKE '%import%' OR l.content LIKE '%export%' THEN 1 ELSE 0 END) as lecciones_corruptas,
  SUM(CASE WHEN l.video_url IS NOT NULL THEN 1 ELSE 0 END) as lecciones_con_video,
  ROUND(
    100.0 * SUM(CASE WHEN l.content LIKE '%import%' OR l.content LIKE '%export%' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as porcentaje_corruptas
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
GROUP BY c.title
ORDER BY lecciones_corruptas DESC;


-- ============================================================================
-- PASO 1: CREAR BACKUP (OBLIGATORIO)
-- ============================================================================
-- ⚠️ NO CONTINUAR SIN EJECUTAR ESTE PASO

-- Query 1.1: Crear tabla de backup completa
CREATE TABLE IF NOT EXISTS lessons_backup_20251117 AS
SELECT * FROM lessons;

-- Query 1.2: Verificar que el backup se creó correctamente
SELECT
  'lessons' as tabla_original,
  COUNT(*) as total_registros
FROM lessons
UNION ALL
SELECT
  'lessons_backup_20251117' as tabla_backup,
  COUNT(*) as total_registros
FROM lessons_backup_20251117;

-- Resultado esperado: Ambas tablas deben tener el mismo número de registros


-- Query 1.3: Verificar integridad del backup
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM lessons) = (SELECT COUNT(*) FROM lessons_backup_20251117)
    THEN '✅ BACKUP COMPLETO - PUEDES CONTINUAR'
    ELSE '❌ ERROR EN BACKUP - NO CONTINUAR'
  END as estado_backup;

-- Solo continúa si ves "✅ BACKUP COMPLETO"


-- ============================================================================
-- PASO 2: LIMPIEZA MASIVA
-- ============================================================================
-- ⚠️ ESTA QUERY MODIFICARÁ LA BASE DE DATOS
-- ⚠️ ASEGÚRATE DE HABER CREADO EL BACKUP PRIMERO

-- Query 2.1: Marcar como NULL todas las lecciones con código TypeScript/JSX
-- Esta query NO elimina las lecciones, solo limpia el contenido corrupto
UPDATE lessons
SET
  content = NULL,
  updated_at = NOW()
WHERE
  content LIKE '%import%'
  OR content LIKE '%export%'
  OR content LIKE '%export default function%'
  OR content LIKE '%from ''next''%'
  OR content LIKE '%from ''react''%';

-- Resultado esperado: "UPDATE X" donde X es el número de lecciones limpiadas


-- Query 2.2: Verificar inmediatamente cuántas lecciones se limpiaron
SELECT
  COUNT(*) as lecciones_marcadas_null,
  (SELECT COUNT(*) FROM lessons) as total_lecciones,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM lessons), 2) as porcentaje_null
FROM lessons
WHERE content IS NULL;


-- ============================================================================
-- PASO 3: VERIFICACIÓN POST-LIMPIEZA
-- ============================================================================

-- Query 3.1: Verificar que NO queden lecciones con código TypeScript
SELECT
  COUNT(*) as lecciones_con_codigo_restante
FROM lessons
WHERE
  content LIKE '%import%'
  OR content LIKE '%export%'
  OR content LIKE '%from ''next''%'
  OR content LIKE '%from ''react''%';

-- Resultado esperado: 0
-- Si el resultado es > 0, algunas lecciones no se limpiaron correctamente


-- Query 3.2: Estado general después de la limpieza
SELECT
  CASE
    WHEN content IS NULL THEN '⚪ LIMPIADO (NULL) - NECESITA CONTENIDO'
    WHEN content_json IS NOT NULL THEN '✨ CON JSON (nuevo sistema)'
    WHEN LENGTH(content) > 100 THEN '✅ CON HTML LIMPIO'
    WHEN LENGTH(content) > 0 THEN '⚠️ CONTENIDO CORTO'
    ELSE '❓ OTRO'
  END as estado,
  COUNT(*) as cantidad,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM lessons), 2) as porcentaje
FROM lessons
GROUP BY
  CASE
    WHEN content IS NULL THEN '⚪ LIMPIADO (NULL) - NECESITA CONTENIDO'
    WHEN content_json IS NOT NULL THEN '✨ CON JSON (nuevo sistema)'
    WHEN LENGTH(content) > 100 THEN '✅ CON HTML LIMPIO'
    WHEN LENGTH(content) > 0 THEN '⚠️ CONTENIDO CORTO'
    ELSE '❓ OTRO'
  END
ORDER BY cantidad DESC;


-- Query 3.3: Lecciones que NECESITAN contenido nuevo (marcadas como NULL)
SELECT
  c.slug as curso_slug,
  c.title as curso,
  m.order_index as modulo_num,
  m.title as modulo,
  l.order_index as leccion_num,
  l.slug as leccion_slug,
  l.title as leccion,
  CASE
    WHEN l.video_url IS NOT NULL THEN '✅ Tiene video'
    ELSE '⚪ Sin video - NECESITA CONTENIDO'
  END as tiene_video,
  l.video_url
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.content IS NULL
ORDER BY
  c.slug,
  m.order_index,
  l.order_index;

-- Guarda esta lista - estas son las lecciones que necesitarás rellenar


-- Query 3.4: Estadísticas por curso después de limpieza
SELECT
  c.title as curso,
  COUNT(*) as total_lecciones,
  SUM(CASE WHEN l.content IS NULL THEN 1 ELSE 0 END) as lecciones_null,
  SUM(CASE WHEN l.video_url IS NOT NULL THEN 1 ELSE 0 END) as lecciones_con_video,
  SUM(CASE WHEN l.content IS NULL AND l.video_url IS NULL THEN 1 ELSE 0 END) as criticas_sin_contenido_ni_video
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
GROUP BY c.title
ORDER BY criticas_sin_contenido_ni_video DESC;


-- Query 3.5: Comparar ANTES vs DESPUÉS (usando el backup)
SELECT
  'ANTES (backup)' as momento,
  COUNT(*) as total,
  SUM(CASE WHEN content IS NULL THEN 1 ELSE 0 END) as null_content,
  SUM(CASE WHEN content LIKE '%import%' OR content LIKE '%export%' THEN 1 ELSE 0 END) as con_codigo
FROM lessons_backup_20251117
UNION ALL
SELECT
  'DESPUÉS (actual)' as momento,
  COUNT(*) as total,
  SUM(CASE WHEN content IS NULL THEN 1 ELSE 0 END) as null_content,
  SUM(CASE WHEN content LIKE '%import%' OR content LIKE '%export%' THEN 1 ELSE 0 END) as con_codigo
FROM lessons;


-- ============================================================================
-- PASO 4: RELLENAR CONTENIDO (MANUAL)
-- ============================================================================
-- Después de la limpieza, necesitarás rellenar el contenido de las lecciones
-- Usa esta plantilla para cada lección:

-- Plantilla para actualizar UNA lección:
/*
UPDATE lessons
SET
  content = '<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-4">TÍTULO DE LA LECCIÓN</h1>

    <p class="mb-4">
      Introducción al tema de la lección...
    </p>

    <h2 class="text-2xl font-bold mb-3">Sección 1</h2>
    <p class="mb-4">
      Contenido de la sección...
    </p>

    <h2 class="text-2xl font-bold mb-3">Sección 2</h2>
    <p class="mb-4">
      Más contenido...
    </p>

    <h2 class="text-2xl font-bold mb-3">Conclusión</h2>
    <p>
      Resumen de la lección...
    </p>
  </div>',
  updated_at = NOW()
WHERE slug = 'LECCION_SLUG_AQUI'
  AND id IN (
    SELECT l.id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'CURSO_SLUG_AQUI'
  );
*/

-- Ejemplo real para lección 1.1:
/*
UPDATE lessons
SET
  content = '<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-4">Introducción a Blockchain</h1>

    <p class="mb-4">
      Blockchain es una tecnología revolucionaria que está transformando
      la forma en que almacenamos y transferimos información de manera segura.
    </p>

    <h2 class="text-2xl font-bold mb-3">¿Qué es Blockchain?</h2>
    <p class="mb-4">
      Blockchain es una base de datos distribuida que mantiene un registro
      continuo de transacciones de manera segura, transparente e inmutable.
    </p>

    <h2 class="text-2xl font-bold mb-3">Características Principales</h2>
    <ul class="list-disc pl-6 mb-4">
      <li>Descentralización</li>
      <li>Inmutabilidad</li>
      <li>Transparencia</li>
      <li>Seguridad criptográfica</li>
    </ul>
  </div>',
  updated_at = NOW()
WHERE slug = 'leccion-1-1'
  AND id IN (
    SELECT l.id
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE c.slug = 'fundamentos-blockchain'
  );
*/


-- ============================================================================
-- PASO 5: VERIFICACIÓN FINAL
-- ============================================================================

-- Query 5.1: Verificar que todas las lecciones tienen contenido O video
SELECT
  c.slug as curso_slug,
  l.slug as leccion_slug,
  l.title as leccion,
  CASE
    WHEN l.content IS NOT NULL AND LENGTH(l.content) > 50 THEN '✅ TIENE CONTENIDO'
    WHEN l.video_url IS NOT NULL THEN '✅ TIENE VIDEO'
    WHEN l.content_json IS NOT NULL THEN '✅ TIENE JSON'
    ELSE '❌ SIN CONTENIDO NI VIDEO'
  END as estado
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
ORDER BY
  CASE
    WHEN l.content IS NULL AND l.video_url IS NULL AND l.content_json IS NULL THEN 1
    ELSE 2
  END,
  c.slug,
  m.order_index,
  l.order_index;


-- Query 5.2: Conteo final - ¿Cuántas lecciones están listas?
SELECT
  COUNT(*) as total_lecciones,
  SUM(CASE WHEN content IS NOT NULL OR video_url IS NOT NULL OR content_json IS NOT NULL THEN 1 ELSE 0 END) as lecciones_ok,
  SUM(CASE WHEN content IS NULL AND video_url IS NULL AND content_json IS NULL THEN 1 ELSE 0 END) as lecciones_vacias,
  ROUND(
    100.0 * SUM(CASE WHEN content IS NOT NULL OR video_url IS NOT NULL OR content_json IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as porcentaje_completas
FROM lessons;


-- ============================================================================
-- PASO 6: ROLLBACK (SOLO SI ALGO SALIÓ MAL)
-- ============================================================================
-- ⚠️ SOLO USAR SI NECESITAS DESHACER LA LIMPIEZA

-- Query 6.1: Restaurar TODAS las lecciones desde el backup
-- ⚠️ ESTO DESHACE TODOS LOS CAMBIOS
/*
UPDATE lessons
SET
  content = b.content,
  updated_at = NOW()
FROM lessons_backup_20251117 b
WHERE lessons.id = b.id;
*/

-- Query 6.2: Verificar restauración
/*
SELECT
  COUNT(*) as total_restauradas,
  SUM(CASE WHEN content IS NOT NULL THEN 1 ELSE 0 END) as con_contenido,
  SUM(CASE WHEN content LIKE '%import%' OR content LIKE '%export%' THEN 1 ELSE 0 END) as con_codigo_restaurado
FROM lessons;
*/

-- Query 6.3: Restaurar UNA sola lección específica
/*
UPDATE lessons
SET
  content = (SELECT content FROM lessons_backup_20251117 WHERE id = 'LESSON_ID_AQUI'),
  updated_at = NOW()
WHERE id = 'LESSON_ID_AQUI';
*/


-- ============================================================================
-- PASO 7: LIMPIEZA DEL BACKUP (DESPUÉS DE VERIFICAR TODO)
-- ============================================================================
-- ⚠️ SOLO EJECUTAR CUANDO TODO ESTÉ FUNCIONANDO CORRECTAMENTE

-- Query 7.1: Eliminar tabla de backup (SOLO después de confirmar que todo está OK)
/*
DROP TABLE IF EXISTS lessons_backup_20251117;
*/


-- ============================================================================
-- QUERIES ÚTILES ADICIONALES
-- ============================================================================

-- Query Extra 1: Buscar lecciones con className (JSX) en lugar de class (HTML)
SELECT
  l.slug,
  l.title,
  CASE
    WHEN l.content LIKE '%className=%' THEN '⚠️ Tiene className (JSX)'
    ELSE '✅ OK'
  END as tiene_jsx
FROM lessons l
WHERE l.content LIKE '%className=%';


-- Query Extra 2: Convertir className a class (si existe)
/*
UPDATE lessons
SET
  content = REPLACE(content, 'className=', 'class='),
  updated_at = NOW()
WHERE content LIKE '%className=%';
*/


-- Query Extra 3: Ver lecciones actualizadas recientemente
SELECT
  l.slug,
  l.title,
  l.updated_at,
  SUBSTRING(l.content, 1, 100) as preview
FROM lessons l
ORDER BY l.updated_at DESC
LIMIT 20;


-- Query Extra 4: Exportar lista de lecciones que necesitan contenido (para CSV)
SELECT
  c.slug as curso_slug,
  c.title as curso_titulo,
  m.order_index as modulo_numero,
  m.slug as modulo_slug,
  m.title as modulo_titulo,
  l.order_index as leccion_numero,
  l.slug as leccion_slug,
  l.title as leccion_titulo,
  l.description as leccion_descripcion,
  CASE WHEN l.video_url IS NOT NULL THEN 'SI' ELSE 'NO' END as tiene_video,
  l.video_url,
  CASE WHEN l.content IS NULL THEN 'NECESITA CONTENIDO' ELSE 'OK' END as estado
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE l.content IS NULL
ORDER BY c.slug, m.order_index, l.order_index;


-- ============================================================================
-- CHECKLIST FINAL
-- ============================================================================
/*
□ PASO 0: Ejecuté diagnóstico inicial
□ PASO 1: Creé backup de la tabla lessons
□ PASO 1: Verifiqué que el backup tiene el mismo número de registros
□ PASO 2: Ejecuté UPDATE para limpiar lecciones corruptas
□ PASO 3: Verifiqué que NO quedan lecciones con código TypeScript
□ PASO 3: Identifiqué qué lecciones necesitan contenido nuevo
□ PASO 4: Rellené el contenido de las lecciones críticas
□ PASO 5: Verifiqué que todas las lecciones tienen contenido O video
□ PASO 5: Probé las lecciones en el navegador
□ PASO 7: (Opcional) Eliminé la tabla de backup después de confirmar

RESULTADO ESPERADO:
- 0 lecciones con código TypeScript/JSX
- Todas las lecciones tienen content, video_url o content_json
- Las lecciones se renderizan correctamente en el navegador
- No hay código fuente visible en ninguna lección
*/


-- ============================================================================
-- NOTAS FINALES
-- ============================================================================
/*
1. NUNCA ejecutes UPDATE sin antes crear BACKUP
2. Ejecuta las queries UNA POR UNA, no todas juntas
3. Verifica los resultados después de cada UPDATE
4. Guarda la lista de lecciones que necesitan contenido
5. Prueba en el navegador después de rellenar cada lección
6. Solo elimina el backup cuando estés 100% seguro
7. Si algo sale mal, usa las queries de ROLLBACK (Paso 6)

PREVENCIÓN FUTURA:
- Validar contenido antes de guardarlo en la BD
- Usar content_json en lugar de content HTML raw
- Separar código de componentes del contenido de lecciones
- Implementar CMS o admin panel para gestionar contenido
- Agregar validaciones en el backend para rechazar imports/exports
*/

-- ============================================================================
-- FIN DEL ARCHIVO
-- ============================================================================
