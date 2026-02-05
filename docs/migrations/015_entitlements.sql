-- =====================================================
-- 015: Entitlements System
-- Tabla de permisos/accesos para cursos premium
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear enum para tipo de entitlement
CREATE TYPE public.entitlement_type AS ENUM (
  'course_access',
  'full_platform',
  'learning_path_access'
);

-- 2. Crear tabla de entitlements
CREATE TABLE public.entitlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type entitlement_type NOT NULL DEFAULT 'course_access',
  target_id uuid NULL,  -- course_id, learning_path_id, o NULL para full_platform
  granted_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  reason text NULL,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,  -- NULL = no expira
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Un usuario no puede tener duplicados activos del mismo tipo+target
  CONSTRAINT unique_active_entitlement UNIQUE (user_id, type, target_id)
);

-- 3. Indices para queries frecuentes
CREATE INDEX idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX idx_entitlements_user_active ON public.entitlements(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_entitlements_target ON public.entitlements(target_id) WHERE target_id IS NOT NULL;
CREATE INDEX idx_entitlements_expires ON public.entitlements(expires_at) WHERE expires_at IS NOT NULL;

-- 4. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_entitlements_updated_at();

-- 5. RLS Policies
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios entitlements
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los admins pueden ver todos los entitlements
CREATE POLICY "Admins can view all entitlements"
  ON public.entitlements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden insertar entitlements
CREATE POLICY "Admins can insert entitlements"
  ON public.entitlements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden actualizar entitlements
CREATE POLICY "Admins can update entitlements"
  ON public.entitlements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden eliminar entitlements
CREATE POLICY "Admins can delete entitlements"
  ON public.entitlements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Comentarios
COMMENT ON TABLE public.entitlements IS 'Sistema de entitlements para acceso a contenido premium';
COMMENT ON COLUMN public.entitlements.type IS 'Tipo: course_access (curso individual), full_platform (acceso total), learning_path_access (ruta)';
COMMENT ON COLUMN public.entitlements.target_id IS 'ID del recurso (course_id o learning_path_id). NULL para full_platform';
COMMENT ON COLUMN public.entitlements.granted_by IS 'Admin que otorgó el acceso';
COMMENT ON COLUMN public.entitlements.expires_at IS 'Fecha de expiración. NULL = sin expiración';
