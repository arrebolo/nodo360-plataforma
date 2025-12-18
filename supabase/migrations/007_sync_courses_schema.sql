-- =====================================================
-- MIGRACIÓN 007: Sincronizar esquema de courses
-- =====================================================
-- Esta migración asegura que la tabla courses tenga todos los campos
-- que el código TypeScript espera usar.
--
-- CAMPOS A AÑADIR (si no existen):
-- - long_description
-- - banner_url
-- - level (enum course_level)
-- - status (enum course_status)
-- - price
-- - instructor_id
-- - total_modules
-- - total_lessons
-- - total_duration_minutes
-- - enrolled_count
-- - meta_title
-- - meta_description
-- - published_at
-- - duration_label (para UI)
-- - is_certifiable (para certificados)
-- =====================================================

-- 1. Crear enums si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_level') THEN
    CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
    CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END $$;

-- 2. Añadir columnas a courses si no existen
-- Usamos ADD COLUMN IF NOT EXISTS para ser idempotentes

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_modules INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_duration_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_label TEXT,
  ADD COLUMN IF NOT EXISTS is_certifiable BOOLEAN DEFAULT true;

-- 3. Añadir columnas con enum (hay que hacerlo por separado para manejar el default)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'level'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN level course_level DEFAULT 'beginner';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN status course_status DEFAULT 'published';
  END IF;
END $$;

-- 4. Añadir índices útiles si no existen
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_certifiable ON public.courses(is_certifiable);

-- 5. Añadir columnas a modules si no existen
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS requires_quiz BOOLEAN DEFAULT false;

-- Hacer slug único por curso
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modules_course_slug_unique'
  ) THEN
    -- Primero generar slugs para los que no tengan
    UPDATE public.modules
    SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE slug IS NULL;

    -- Luego crear la constraint
    ALTER TABLE public.modules
      ADD CONSTRAINT modules_course_slug_unique UNIQUE(course_id, slug);
  END IF;
END $$;

-- 6. Añadir columnas a lessons si no existen
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slides_url TEXT,
  ADD COLUMN IF NOT EXISTS resources_url TEXT;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON COLUMN public.courses.level IS 'Nivel de dificultad: beginner, intermediate, advanced';
COMMENT ON COLUMN public.courses.status IS 'Estado del curso: draft, published, archived';
COMMENT ON COLUMN public.courses.duration_label IS 'Etiqueta de duración para mostrar en UI (ej: "2h 30min")';
COMMENT ON COLUMN public.courses.is_certifiable IS 'Si el curso otorga certificado al completarlo';
COMMENT ON COLUMN public.modules.requires_quiz IS 'Si el módulo requiere pasar un quiz para avanzar';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
