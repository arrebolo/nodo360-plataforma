-- Agregar campos para filtros de cursos
-- Este script agrega campos necesarios para el sistema de filtrado

-- Agregar campos para filtros
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'bitcoin',
ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Constraints para validación
ALTER TABLE courses
ADD CONSTRAINT courses_level_check
CHECK (level IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE courses
ADD CONSTRAINT courses_category_check
CHECK (category IN ('bitcoin', 'blockchain', 'defi', 'nfts', 'development', 'trading', 'other'));

-- Índices para mejor performance en filtros
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_duration ON courses(duration_hours);
CREATE INDEX IF NOT EXISTS idx_courses_tags ON courses USING GIN(tags);

-- Comentarios descriptivos
COMMENT ON COLUMN courses.level IS 'Nivel del curso: beginner, intermediate, advanced';
COMMENT ON COLUMN courses.category IS 'Categoría del curso: bitcoin, blockchain, defi, nfts, development, trading, other';
COMMENT ON COLUMN courses.duration_hours IS 'Duración estimada en horas';
COMMENT ON COLUMN courses.tags IS 'Tags adicionales para búsqueda y filtrado';

-- Actualizar cursos existentes con valores por defecto
UPDATE courses
SET
  level = 'beginner',
  category = 'bitcoin',
  duration_hours = 10
WHERE level IS NULL OR category IS NULL;
