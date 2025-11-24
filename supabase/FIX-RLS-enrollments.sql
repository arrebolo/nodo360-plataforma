-- =====================================================
-- FIX: Políticas RLS para course_enrollments
-- =====================================================
-- Este script agrega las políticas RLS necesarias para
-- que la inscripción de usuarios funcione correctamente
--
-- CÓMO APLICAR:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar y pegar este contenido
-- 3. Ejecutar (Run)
-- =====================================================

-- Primero, eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.course_enrollments;

-- Habilitar RLS en la tabla
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA USUARIOS
-- =====================================================

-- Los usuarios pueden ver sus propias inscripciones
CREATE POLICY "Users can view own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propias inscripciones
-- ESTA ES LA POLÍTICA CLAVE PARA QUE FUNCIONE /api/enroll
CREATE POLICY "Users can create own enrollments"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias inscripciones
CREATE POLICY "Users can update own enrollments"
  ON public.course_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias inscripciones
CREATE POLICY "Users can delete own enrollments"
  ON public.course_enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA INSTRUCTORES Y ADMINS
-- =====================================================

-- Los instructores pueden ver inscripciones de sus cursos
CREATE POLICY "Instructors can view course enrollments"
  ON public.course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_enrollments.course_id
        AND courses.instructor_id = auth.uid()
    )
  );

-- Los admins pueden ver todas las inscripciones
CREATE POLICY "Admins can view all enrollments"
  ON public.course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Contar políticas creadas
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'course_enrollments'
    AND schemaname = 'public';

  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Políticas RLS aplicadas correctamente (% políticas)', policy_count;
  ELSE
    RAISE WARNING '⚠️  Solo se encontraron % políticas, se esperaban al menos 4', policy_count;
  END IF;
END $$;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Si ves el mensaje "✅ Políticas RLS aplicadas correctamente"
-- entonces la inscripción debería funcionar ahora.
--
-- Para probar:
-- 1. Ir a tu aplicación
-- 2. Intentar inscribirte en un curso
-- 3. Ya NO deberías ver error 500
-- =====================================================
