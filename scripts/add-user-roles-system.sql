-- =============================================
-- SISTEMA DE ROLES EXTENDIDO - NODO360
-- =============================================

-- 1. Crear ENUM para roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'user',
        'candidate_mentor',
        'mentor',
        'admin',
        'council'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    granted_by UUID REFERENCES public.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un usuario puede tener múltiples roles
    UNIQUE(user_id, role)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);

-- 4. RLS Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Los usuarios pueden ver sus propios roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Solo admins pueden ver todos los roles
CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Solo admins pueden insertar roles
CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Solo admins pueden actualizar roles
CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Solo admins pueden eliminar roles
CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- 6. Función helper para verificar rol
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id
        AND role = check_role
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener todos los roles de un usuario
CREATE OR REPLACE FUNCTION public.get_user_roles(check_user_id UUID)
RETURNS user_role[] AS $$
DECLARE
    roles user_role[];
BEGIN
    SELECT ARRAY_AGG(role) INTO roles
    FROM public.user_roles
    WHERE user_id = check_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

    -- Si no tiene roles, retornar array con 'user'
    IF roles IS NULL THEN
        RETURN ARRAY['user']::user_role[];
    END IF;

    RETURN roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para obtener el rol más alto
CREATE OR REPLACE FUNCTION public.get_highest_role(check_user_id UUID)
RETURNS user_role AS $$
DECLARE
    highest user_role;
BEGIN
    SELECT role INTO highest
    FROM public.user_roles
    WHERE user_id = check_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY
        CASE role
            WHEN 'council' THEN 5
            WHEN 'admin' THEN 4
            WHEN 'mentor' THEN 3
            WHEN 'candidate_mentor' THEN 2
            WHEN 'user' THEN 1
        END DESC
    LIMIT 1;

    -- Si no tiene roles, retornar 'user'
    IF highest IS NULL THEN
        RETURN 'user'::user_role;
    END IF;

    RETURN highest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Asignar rol 'user' por defecto a usuarios existentes que no tienen roles
INSERT INTO public.user_roles (user_id, role, notes)
SELECT id, 'user', 'Rol asignado automáticamente en migración'
FROM public.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- 10. Asignar rol admin al usuario actual (albertonunezdiaz@gmail.com)
INSERT INTO public.user_roles (user_id, role, notes)
SELECT id, 'admin', 'Admin principal del sistema'
FROM public.users
WHERE email = 'albertonunezdiaz@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 11. Vista útil para ver usuarios con sus roles
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    COALESCE(
        (SELECT ARRAY_AGG(ur.role ORDER BY
            CASE ur.role
                WHEN 'council' THEN 5
                WHEN 'admin' THEN 4
                WHEN 'mentor' THEN 3
                WHEN 'candidate_mentor' THEN 2
                WHEN 'user' THEN 1
            END DESC
        ) FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.is_active = true),
        ARRAY['user']::user_role[]
    ) as roles,
    public.get_highest_role(u.id) as highest_role
FROM public.users u;

-- 12. Comentarios para documentación
COMMENT ON TABLE public.user_roles IS 'Sistema de roles multi-nivel para usuarios de Nodo360';
COMMENT ON COLUMN public.user_roles.role IS 'Rol del usuario: user, candidate_mentor, mentor, admin, council';
COMMENT ON COLUMN public.user_roles.granted_by IS 'ID del admin que otorgó el rol';
COMMENT ON COLUMN public.user_roles.expires_at IS 'Fecha de expiración del rol (null = permanente)';
COMMENT ON FUNCTION public.has_role IS 'Verifica si un usuario tiene un rol específico activo';
COMMENT ON FUNCTION public.get_user_roles IS 'Obtiene todos los roles activos de un usuario';
COMMENT ON FUNCTION public.get_highest_role IS 'Obtiene el rol de mayor jerarquía de un usuario';
