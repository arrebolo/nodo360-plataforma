-- =====================================================
-- MIGRATION 014: RLS para contenido de instructores
-- =====================================================
-- Permite a los instructores ver y gestionar módulos y lecciones
-- de sus propios cursos, incluso si no están publicados.
-- =====================================================

-- =====================================================
-- MODULES: Políticas para instructores
-- =====================================================

-- Permitir a instructores ver módulos de sus propios cursos
DROP POLICY IF EXISTS "Instructors can view own course modules" ON public.modules;
CREATE POLICY "Instructors can view own course modules"
ON public.modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = modules.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Permitir a instructores crear módulos en sus propios cursos
DROP POLICY IF EXISTS "Instructors can create modules in own courses" ON public.modules;
CREATE POLICY "Instructors can create modules in own courses"
ON public.modules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = modules.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Permitir a instructores actualizar módulos de sus propios cursos
DROP POLICY IF EXISTS "Instructors can update own course modules" ON public.modules;
CREATE POLICY "Instructors can update own course modules"
ON public.modules FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = modules.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Permitir a instructores eliminar módulos de sus propios cursos
DROP POLICY IF EXISTS "Instructors can delete own course modules" ON public.modules;
CREATE POLICY "Instructors can delete own course modules"
ON public.modules FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = modules.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- =====================================================
-- LESSONS: Políticas para instructores
-- =====================================================

-- Permitir a instructores ver lecciones de sus propios cursos
DROP POLICY IF EXISTS "Instructors can view own course lessons" ON public.lessons;
CREATE POLICY "Instructors can view own course lessons"
ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
    AND c.instructor_id = auth.uid()
  )
);

-- Permitir a instructores crear lecciones en sus propios cursos
DROP POLICY IF EXISTS "Instructors can create lessons in own courses" ON public.lessons;
CREATE POLICY "Instructors can create lessons in own courses"
ON public.lessons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
    AND c.instructor_id = auth.uid()
  )
);

-- Permitir a instructores actualizar lecciones de sus propios cursos
DROP POLICY IF EXISTS "Instructors can update own course lessons" ON public.lessons;
CREATE POLICY "Instructors can update own course lessons"
ON public.lessons FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
    AND c.instructor_id = auth.uid()
  )
);

-- Permitir a instructores eliminar lecciones de sus propios cursos
DROP POLICY IF EXISTS "Instructors can delete own course lessons" ON public.lessons;
CREATE POLICY "Instructors can delete own course lessons"
ON public.lessons FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
    AND c.instructor_id = auth.uid()
  )
);

-- =====================================================
-- Log
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 014: Instructor content RLS policies completed';
END $$;
