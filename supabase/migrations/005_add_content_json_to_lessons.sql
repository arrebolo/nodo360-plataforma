-- 005_add_content_json_to_lessons.sql
-- Añade columna content_json para contenido estructurado en lecciones
-- La columna content (TEXT) se mantiene por compatibilidad

-- Añadir columna content_json si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lessons'
      AND column_name = 'content_json'
  ) THEN
    ALTER TABLE public.lessons
    ADD COLUMN content_json JSONB DEFAULT NULL;

    COMMENT ON COLUMN public.lessons.content_json IS
      'Contenido estructurado de la lección en formato JSON. Formato: { "html": "<p>...</p>" }';
  END IF;
END $$;

-- Opcional: Migrar contenido existente de content a content_json
-- UPDATE public.lessons
-- SET content_json = jsonb_build_object('html', content)
-- WHERE content IS NOT NULL AND content_json IS NULL;

-- Añadir columna course_id si no existe (algunas queries lo usan directamente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lessons'
      AND column_name = 'course_id'
  ) THEN
    -- Añadir columna course_id derivada del módulo
    ALTER TABLE public.lessons
    ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

    -- Poblar course_id desde la relación module -> course
    UPDATE public.lessons l
    SET course_id = m.course_id
    FROM public.modules m
    WHERE l.module_id = m.id AND l.course_id IS NULL;

    COMMENT ON COLUMN public.lessons.course_id IS
      'Referencia directa al curso para queries optimizadas';
  END IF;
END $$;

-- Índice para búsquedas por course_id + slug
CREATE INDEX IF NOT EXISTS idx_lessons_course_slug
ON public.lessons(course_id, slug);
