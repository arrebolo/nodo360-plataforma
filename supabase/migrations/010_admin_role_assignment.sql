-- =====================================================
-- MIGRACIÓN 010: ASIGNACIÓN DE ROLES POR ADMIN
-- =====================================================
-- Fecha: 2026-01-25
-- Descripción: Funciones para que admins asignen roles
--   de instructor y mentor directamente, creando todos
--   los registros necesarios automáticamente.
-- =====================================================


-- #####################################################
-- SECCIÓN 1: FUNCIÓN PARA ASIGNAR INSTRUCTOR
-- #####################################################

-- =====================================================
-- Función: Asignar rol de instructor por admin
-- Crea: user_roles, instructor_profiles, actualiza users.role
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_assign_instructor(
  p_user_id UUID,
  p_admin_id UUID,
  p_bio TEXT DEFAULT 'Instructor designado por administración',
  p_headline TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT 'Designado por admin'
)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_is_admin BOOLEAN;
  v_profile_id UUID;
BEGIN
  -- Verificar que el admin es realmente admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role = 'admin' AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores pueden asignar roles');
  END IF;

  -- Verificar que el usuario existe
  SELECT id, full_name, role INTO v_user FROM public.users WHERE id = p_user_id;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  -- Verificar si ya es instructor activo
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'instructor' AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El usuario ya es instructor activo');
  END IF;

  -- Actualizar rol en users (solo si no es admin/mentor)
  IF v_user.role NOT IN ('admin', 'mentor') THEN
    UPDATE public.users SET role = 'instructor' WHERE id = p_user_id;
  END IF;

  -- Crear o actualizar perfil de instructor
  INSERT INTO public.instructor_profiles (
    user_id,
    bio,
    headline,
    is_active,
    is_verified,
    accepts_messages
  )
  VALUES (
    p_user_id,
    p_bio,
    p_headline,
    true,
    true,  -- Verificado por defecto al ser designado por admin
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = true,
    is_verified = true,
    bio = COALESCE(NULLIF(EXCLUDED.bio, 'Instructor designado por administración'), instructor_profiles.bio),
    headline = COALESCE(EXCLUDED.headline, instructor_profiles.headline),
    updated_at = NOW()
  RETURNING id INTO v_profile_id;

  -- Crear registro en user_roles
  INSERT INTO public.user_roles (user_id, role, granted_by, notes, is_active)
  VALUES (p_user_id, 'instructor', p_admin_id, p_reason, true)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true,
    granted_by = p_admin_id,
    notes = p_reason,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Instructor asignado correctamente',
    'user_id', p_user_id,
    'user_name', v_user.full_name,
    'profile_id', v_profile_id,
    'assigned_by', p_admin_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 2: FUNCIÓN PARA ASIGNAR MENTOR
-- #####################################################

-- =====================================================
-- Función: Asignar rol de mentor por admin
-- Crea: user_roles, actualiza users.role, registra en mentor_points
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_assign_mentor(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Designado por admin',
  p_initial_points INTEGER DEFAULT 650  -- Mínimo requerido
)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_is_admin BOOLEAN;
  v_current_points INTEGER;
BEGIN
  -- Verificar que el admin es realmente admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role = 'admin' AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores pueden asignar roles');
  END IF;

  -- Verificar que el usuario existe
  SELECT id, full_name, role INTO v_user FROM public.users WHERE id = p_user_id;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  -- Verificar si ya es mentor activo
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El usuario ya es mentor activo');
  END IF;

  -- Obtener puntos actuales
  SELECT COALESCE(SUM(points), 0) INTO v_current_points
  FROM public.mentor_points WHERE user_id = p_user_id;

  -- Actualizar rol en users (mentor tiene precedencia sobre instructor)
  IF v_user.role != 'admin' THEN
    UPDATE public.users SET role = 'mentor' WHERE id = p_user_id;
  END IF;

  -- Crear registro en user_roles
  INSERT INTO public.user_roles (user_id, role, granted_by, notes, is_active)
  VALUES (p_user_id, 'mentor', p_admin_id, p_reason, true)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true,
    granted_by = p_admin_id,
    notes = p_reason,
    updated_at = NOW();

  -- Si no tiene suficientes puntos, otorgarlos
  IF v_current_points < p_initial_points THEN
    INSERT INTO public.mentor_points (
      user_id,
      category,
      points,
      description
    )
    VALUES (
      p_user_id,
      'other',
      p_initial_points - v_current_points,
      'Puntos iniciales - designación por admin: ' || p_reason
    );
  END IF;

  -- Registrar inicio como mentor
  INSERT INTO public.mentor_points (user_id, category, points, description)
  VALUES (p_user_id, 'other', 0, 'Inicio como mentor - designado por admin');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Mentor asignado correctamente',
    'user_id', p_user_id,
    'user_name', v_user.full_name,
    'assigned_by', p_admin_id,
    'total_points', GREATEST(v_current_points, p_initial_points)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 3: FUNCIÓN PARA REVOCAR INSTRUCTOR
-- #####################################################

-- =====================================================
-- Función: Revocar rol de instructor por admin
-- Desactiva: user_roles, instructor_profiles
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_revoke_instructor(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Revocado por admin'
)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_is_admin BOOLEAN;
  v_has_mentor_role BOOLEAN;
  v_new_role TEXT;
BEGIN
  -- Verificar que el admin es realmente admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role = 'admin' AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores pueden revocar roles');
  END IF;

  -- Verificar que el usuario existe
  SELECT id, full_name, role INTO v_user FROM public.users WHERE id = p_user_id;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  -- Verificar si es instructor activo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'instructor' AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El usuario no es instructor activo');
  END IF;

  -- Desactivar rol de instructor
  UPDATE public.user_roles
  SET is_active = false, notes = notes || ' | ' || p_reason, updated_at = NOW()
  WHERE user_id = p_user_id AND role = 'instructor';

  -- Desactivar perfil de instructor
  UPDATE public.instructor_profiles
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Revocar certificaciones activas
  UPDATE public.instructor_certifications
  SET status = 'revoked', revoked_at = NOW(), revoked_reason = p_reason, updated_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';

  -- Determinar nuevo rol (si tiene mentor activo, mantener mentor)
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true
  ) INTO v_has_mentor_role;

  IF v_has_mentor_role THEN
    v_new_role := 'mentor';
  ELSE
    v_new_role := 'student';
  END IF;

  -- Actualizar rol en users si no es admin
  IF v_user.role NOT IN ('admin', 'mentor') THEN
    UPDATE public.users SET role = v_new_role WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rol de instructor revocado',
    'user_id', p_user_id,
    'user_name', v_user.full_name,
    'new_role', v_new_role,
    'revoked_by', p_admin_id,
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 4: FUNCIÓN PARA REVOCAR MENTOR
-- #####################################################

-- =====================================================
-- Función: Revocar rol de mentor por admin
-- Similar a remove_mentor_status pero para admins
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_revoke_mentor(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Revocado por admin',
  p_apply_cooldown BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_is_admin BOOLEAN;
  v_has_instructor_role BOOLEAN;
  v_new_role TEXT;
  v_cooldown_months INTEGER;
  v_cooldown_until TIMESTAMPTZ;
BEGIN
  -- Verificar que el admin es realmente admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_admin_id AND role = 'admin' AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores pueden revocar roles');
  END IF;

  -- Verificar que el usuario existe
  SELECT id, full_name, role INTO v_user FROM public.users WHERE id = p_user_id;
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  -- Verificar si es mentor activo
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'mentor' AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El usuario no es mentor activo');
  END IF;

  -- Obtener cooldown
  IF p_apply_cooldown THEN
    SELECT (config_value)::INTEGER INTO v_cooldown_months
    FROM public.mentor_config WHERE config_key = 'cooldown_months';
    v_cooldown_until := NOW() + (v_cooldown_months || ' months')::INTERVAL;
  END IF;

  -- Desactivar rol de mentor
  UPDATE public.user_roles
  SET is_active = false, notes = notes || ' | ' || p_reason, updated_at = NOW()
  WHERE user_id = p_user_id AND role = 'mentor';

  -- Registrar punto negativo con la razón
  INSERT INTO public.mentor_points (user_id, category, points, description)
  VALUES (p_user_id, 'other', -100, 'Mentor removido por admin: ' || p_reason);

  -- Si aplica cooldown, registrar en la última aplicación aprobada
  IF p_apply_cooldown THEN
    UPDATE public.mentor_applications SET
      can_reapply_at = v_cooldown_until,
      updated_at = NOW()
    WHERE id = (
      SELECT id FROM public.mentor_applications
      WHERE user_id = p_user_id AND status = 'approved'
      ORDER BY decided_at DESC LIMIT 1
    );
  END IF;

  -- Determinar nuevo rol (si tiene instructor activo, mantener instructor)
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'instructor' AND is_active = true
  ) INTO v_has_instructor_role;

  IF v_has_instructor_role THEN
    v_new_role := 'instructor';
  ELSE
    v_new_role := 'student';
  END IF;

  -- Actualizar rol en users si no es admin
  IF v_user.role NOT IN ('admin') THEN
    UPDATE public.users SET role = v_new_role WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rol de mentor revocado',
    'user_id', p_user_id,
    'user_name', v_user.full_name,
    'new_role', v_new_role,
    'revoked_by', p_admin_id,
    'reason', p_reason,
    'cooldown_until', v_cooldown_until
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 5: FUNCIÓN PARA LISTAR USUARIOS ASIGNABLES
-- #####################################################

-- =====================================================
-- Función: Listar usuarios que pueden recibir rol
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_list_assignable_users(
  p_role TEXT,  -- 'instructor' o 'mentor'
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  current_role TEXT,
  avatar_url TEXT,
  has_role BOOLEAN,
  role_is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.full_name,
    u.email,
    u.role as current_role,
    u.avatar_url,
    EXISTS(
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = p_role
    ) as has_role,
    COALESCE(
      (SELECT ur.is_active FROM public.user_roles ur
       WHERE ur.user_id = u.id AND ur.role = p_role),
      false
    ) as role_is_active
  FROM public.users u
  WHERE u.role != 'admin'
  AND (
    p_search IS NULL
    OR u.full_name ILIKE '%' || p_search || '%'
    OR u.email ILIKE '%' || p_search || '%'
  )
  ORDER BY
    -- Primero los que NO tienen el rol activo (candidatos)
    COALESCE((SELECT ur.is_active FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = p_role), false) ASC,
    u.full_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- #####################################################
-- SECCIÓN 6: AÑADIR COLUMNA is_public SI NO EXISTE
-- #####################################################

-- Añadir is_public a instructor_profiles si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'instructor_profiles'
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.instructor_profiles ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
END $$;


-- #####################################################
-- SECCIÓN 7: COMENTARIOS
-- #####################################################

COMMENT ON FUNCTION public.admin_assign_instructor IS 'Asigna rol de instructor a un usuario. Crea perfil y user_role automáticamente.';
COMMENT ON FUNCTION public.admin_assign_mentor IS 'Asigna rol de mentor a un usuario. Crea user_role y otorga puntos iniciales si es necesario.';
COMMENT ON FUNCTION public.admin_revoke_instructor IS 'Revoca rol de instructor. Desactiva perfil y certificaciones.';
COMMENT ON FUNCTION public.admin_revoke_mentor IS 'Revoca rol de mentor. Aplica penalización de puntos y cooldown opcional.';
COMMENT ON FUNCTION public.admin_list_assignable_users IS 'Lista usuarios que pueden recibir un rol, con su estado actual.';


-- #####################################################
-- SECCIÓN 8: VERIFICACIÓN
-- #####################################################

-- Verificar funciones creadas
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE 'admin_%'
AND pronamespace = 'public'::regnamespace
ORDER BY proname;
