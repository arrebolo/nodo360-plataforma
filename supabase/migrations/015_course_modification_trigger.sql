-- =====================================================
-- MIGRATION 015: Trigger para re-revisión de cursos modificados
-- =====================================================
-- Cuando un curso publicado es modificado en campos de contenido,
-- automáticamente vuelve a estado pending_review para re-aprobación.
-- =====================================================

-- Función que verifica modificaciones en cursos publicados
CREATE OR REPLACE FUNCTION check_course_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si estaba publicado
    IF OLD.status = 'published' THEN
        -- Si se modificaron campos de contenido crítico
        IF (OLD.title IS DISTINCT FROM NEW.title) OR
           (OLD.description IS DISTINCT FROM NEW.description) OR
           (OLD.long_description IS DISTINCT FROM NEW.long_description) OR
           (OLD.level IS DISTINCT FROM NEW.level) OR
           (OLD.price IS DISTINCT FROM NEW.price) OR
           (OLD.is_free IS DISTINCT FROM NEW.is_free) OR
           (OLD.is_premium IS DISTINCT FROM NEW.is_premium) OR
           (OLD.thumbnail_url IS DISTINCT FROM NEW.thumbnail_url) OR
           (OLD.banner_url IS DISTINCT FROM NEW.banner_url) THEN

            -- Volver a revisión automáticamente
            NEW.status := 'pending_review';
            NEW.updated_at := NOW();

            -- Log para debugging
            RAISE NOTICE 'Course % moved to pending_review due to content modification', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_course_modification ON public.courses;

-- Crear trigger que se ejecuta ANTES del update
CREATE TRIGGER trigger_course_modification
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION check_course_modification();

-- =====================================================
-- Función para que admin pueda editar sin re-revisión
-- =====================================================
-- Esta función permite bypass del trigger para admins
-- Se usa con: SELECT admin_update_course(course_id, jsonb_data)

CREATE OR REPLACE FUNCTION admin_update_course(
    p_course_id UUID,
    p_data JSONB
)
RETURNS VOID AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Verificar que el usuario es admin
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = auth.uid();

    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden usar esta función';
    END IF;

    -- Desactivar trigger temporalmente para esta sesión
    ALTER TABLE public.courses DISABLE TRIGGER trigger_course_modification;

    -- Actualizar el curso
    UPDATE public.courses
    SET
        title = COALESCE(p_data->>'title', title),
        description = COALESCE(p_data->>'description', description),
        long_description = COALESCE(p_data->>'long_description', long_description),
        level = COALESCE(p_data->>'level', level),
        price = COALESCE((p_data->>'price')::DECIMAL, price),
        is_free = COALESCE((p_data->>'is_free')::BOOLEAN, is_free),
        is_premium = COALESCE((p_data->>'is_premium')::BOOLEAN, is_premium),
        thumbnail_url = COALESCE(p_data->>'thumbnail_url', thumbnail_url),
        banner_url = COALESCE(p_data->>'banner_url', banner_url),
        updated_at = NOW()
    WHERE id = p_course_id;

    -- Reactivar trigger
    ALTER TABLE public.courses ENABLE TRIGGER trigger_course_modification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Log de la migración
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 015: Course modification trigger created';
    RAISE NOTICE '   - Published courses will go to pending_review when modified';
    RAISE NOTICE '   - Admins can bypass with admin_update_course() function';
END $$;
