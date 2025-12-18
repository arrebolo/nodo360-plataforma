-- 006_admin_rls_policies.sql
-- Políticas RLS para usuarios admin
-- Nota: Las APIs de admin usan service_role que bypasa RLS,
-- pero estas policies permiten acceso directo desde el cliente si es necesario

-- ====================================================
-- FUNCIÓN HELPER: Verificar si el usuario es admin
-- ====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ====================================================
-- POLICIES PARA COURSES (Admin)
-- ====================================================
-- Admins pueden ver todos los cursos (incluido drafts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'courses'
    AND policyname = 'Admins can view all courses'
  ) THEN
    CREATE POLICY "Admins can view all courses"
      ON public.courses FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

-- Admins pueden editar todos los cursos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'courses'
    AND policyname = 'Admins can update all courses'
  ) THEN
    CREATE POLICY "Admins can update all courses"
      ON public.courses FOR UPDATE
      USING (public.is_admin());
  END IF;
END $$;

-- Admins pueden eliminar cursos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'courses'
    AND policyname = 'Admins can delete courses'
  ) THEN
    CREATE POLICY "Admins can delete courses"
      ON public.courses FOR DELETE
      USING (public.is_admin());
  END IF;
END $$;

-- ====================================================
-- POLICIES PARA MODULES (Admin)
-- ====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'modules'
    AND policyname = 'Admins can manage all modules'
  ) THEN
    CREATE POLICY "Admins can manage all modules"
      ON public.modules FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- ====================================================
-- POLICIES PARA LESSONS (Admin)
-- ====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lessons'
    AND policyname = 'Admins can manage all lessons'
  ) THEN
    CREATE POLICY "Admins can manage all lessons"
      ON public.lessons FOR ALL
      USING (public.is_admin());
  END IF;
END $$;

-- ====================================================
-- POLICIES PARA USERS (Admin)
-- ====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Admins can view all users'
  ) THEN
    CREATE POLICY "Admins can view all users"
      ON public.users FOR SELECT
      USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Admins can update all users'
  ) THEN
    CREATE POLICY "Admins can update all users"
      ON public.users FOR UPDATE
      USING (public.is_admin());
  END IF;
END $$;
