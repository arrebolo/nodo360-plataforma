-- =====================================================
-- SETUP LESSON SYSTEM - Nuevo sistema de lecciones
-- =====================================================
-- Este script configura la base de datos para soportar
-- el nuevo sistema de lecciones con contenido JSON
-- =====================================================

-- 1. AGREGAR COLUMNA content_json A LESSONS
-- =====================================================
-- Esta columna almacenará el contenido estructurado en formato JSON
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Índice GIN para mejorar búsquedas en el JSON
CREATE INDEX IF NOT EXISTS idx_lessons_content_json
ON lessons USING GIN (content_json);

-- Comentario descriptivo
COMMENT ON COLUMN lessons.content_json IS
'Contenido estructurado en formato JSON para el nuevo sistema de lecciones. Schema: LessonContent (version 1.0)';


-- 2. VERIFICAR/AGREGAR COLUMNA is_premium A COURSES
-- =====================================================
-- Esta columna determina si un curso es premium o gratuito
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Establecer valor por defecto para cursos existentes
UPDATE courses
SET is_premium = false
WHERE is_premium IS NULL;

-- Asegurar que no sea NULL
ALTER TABLE courses
ALTER COLUMN is_premium SET DEFAULT false;

-- Comentario descriptivo
COMMENT ON COLUMN courses.is_premium IS
'Indica si el curso es premium (true) o gratuito (false). Afecta qué renderer se usa para las lecciones.';

-- Índice para filtrar cursos premium
CREATE INDEX IF NOT EXISTS idx_courses_is_premium
ON courses (is_premium);


-- 3. COLUMNA AUXILIAR PARA TRACKING DE MIGRACIÓN
-- =====================================================
-- Útil para saber qué lecciones ya fueron migradas al nuevo formato
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS migrated_to_json BOOLEAN DEFAULT false;

-- Comentario
COMMENT ON COLUMN lessons.migrated_to_json IS
'Flag para tracking: indica si esta lección ya fue migrada al formato JSON';

-- Índice para filtrar lecciones migradas
CREATE INDEX IF NOT EXISTS idx_lessons_migrated
ON lessons (migrated_to_json);


-- 4. FUNCIÓN HELPER PARA VALIDAR JSON
-- =====================================================
-- Valida que el JSON tenga la estructura correcta del schema LessonContent
CREATE OR REPLACE FUNCTION validate_lesson_content_json(content JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que tenga los campos requeridos
  IF content ? 'version' AND content ? 'blocks' THEN
    -- Verificar que version sea "1.0"
    IF content->>'version' = '1.0' THEN
      -- Verificar que blocks sea un array
      IF jsonb_typeof(content->'blocks') = 'array' THEN
        RETURN true;
      END IF;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION validate_lesson_content_json IS
'Valida que el JSON del contenido de lección tenga la estructura correcta (version 1.0, blocks array)';


-- 5. TRIGGER PARA AUTO-MARCAR MIGRACIÓN
-- =====================================================
-- Automáticamente marca migrated_to_json = true cuando se agrega content_json
CREATE OR REPLACE FUNCTION auto_mark_migration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content_json IS NOT NULL AND validate_lesson_content_json(NEW.content_json) THEN
    NEW.migrated_to_json := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_mark_migration ON lessons;

CREATE TRIGGER trigger_auto_mark_migration
  BEFORE INSERT OR UPDATE OF content_json ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_migration();

-- Comentario
COMMENT ON FUNCTION auto_mark_migration IS
'Trigger que automáticamente marca migrated_to_json = true cuando se agrega content_json válido';


-- 6. VISTA PARA ESTADÍSTICAS DE MIGRACIÓN
-- =====================================================
-- Útil para ver el progreso de migración
CREATE OR REPLACE VIEW lesson_migration_stats AS
SELECT
  c.id as course_id,
  c.title as course_name,
  c.is_premium,
  COUNT(l.id) as total_lessons,
  COUNT(l.content_json) as lessons_with_json,
  COUNT(CASE WHEN l.migrated_to_json THEN 1 END) as lessons_migrated,
  ROUND(
    (COUNT(l.content_json)::DECIMAL / NULLIF(COUNT(l.id), 0)) * 100,
    2
  ) as migration_percentage
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
GROUP BY c.id, c.title, c.is_premium
ORDER BY c.title;

-- Comentario
COMMENT ON VIEW lesson_migration_stats IS
'Vista que muestra estadísticas de migración de lecciones por curso';


-- 7. CONSULTAS ÚTILES PARA VERIFICACIÓN
-- =====================================================

-- Ver todas las lecciones migradas
-- SELECT id, title, migrated_to_json FROM lessons WHERE migrated_to_json = true;

-- Ver estadísticas de migración
-- SELECT * FROM lesson_migration_stats;

-- Ver lecciones pendientes de migrar
-- SELECT l.id, l.title, m.title as module, c.title as course
-- FROM lessons l
-- JOIN modules m ON m.id = l.module_id
-- JOIN courses c ON c.id = m.course_id
-- WHERE l.migrated_to_json = false;

-- Marcar un curso como premium
-- UPDATE courses SET is_premium = true WHERE slug = 'nombre-del-curso';

-- Verificar estructura de una lección JSON
-- SELECT
--   id,
--   title,
--   validate_lesson_content_json(content_json) as is_valid,
--   content_json->>'version' as version,
--   jsonb_array_length(content_json->'blocks') as block_count
-- FROM lessons
-- WHERE content_json IS NOT NULL;


-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Para ejecutar este script:
-- 1. Abre el SQL Editor en Supabase Dashboard
-- 2. Copia y pega todo este contenido
-- 3. Ejecuta (Run)
--
-- Para verificar que funcionó:
-- SELECT * FROM lesson_migration_stats;
-- =====================================================
