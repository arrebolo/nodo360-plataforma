-- ============================================================
-- MIGRACIÓN 008: Campos adicionales para landing de curso
-- ============================================================

-- 1. Qué vas a aprender (array de bullets)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];

-- 2. Requisitos previos (array de bullets)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS requirements TEXT[];

-- 3. Público objetivo (texto libre)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- 4. Subtítulo del curso
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS subtitle TEXT;

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON COLUMN public.courses.learning_objectives IS 'Array de puntos sobre qué aprenderá el estudiante';
COMMENT ON COLUMN public.courses.requirements IS 'Array de requisitos previos para el curso';
COMMENT ON COLUMN public.courses.target_audience IS 'Descripción del público objetivo';
COMMENT ON COLUMN public.courses.subtitle IS 'Subtítulo corto del curso';

-- ============================================================
-- VERIFICAR QUE SE AÑADIERON
-- ============================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'courses'
-- AND column_name IN ('learning_objectives', 'requirements', 'target_audience', 'subtitle');
