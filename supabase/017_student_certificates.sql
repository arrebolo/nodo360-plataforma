-- =====================================================
-- NODO360 PLATFORM - AUTO CERTIFICATE GENERATION
-- Migration: 017_student_certificates.sql
-- =====================================================
-- Este script añade la generación automática de certificados
-- cuando un estudiante completa un curso al 100%.
--
-- PRERREQUISITOS:
-- - migration-quiz-certificates.sql debe estar aplicado
-- - 04-migration-enrollments.sql debe estar aplicado
--
-- FUNCIONALIDAD:
-- - Trigger automático al completar curso (completed_at NOT NULL)
-- - Función para generar certificado de curso
-- - Índices adicionales para consultas de certificados
-- =====================================================

-- =====================================================
-- FUNCTION: auto_issue_course_certificate
-- =====================================================
-- Genera automáticamente un certificado cuando un curso
-- se marca como completado en course_enrollments.

CREATE OR REPLACE FUNCTION auto_issue_course_certificate()
RETURNS TRIGGER AS $$
DECLARE
  v_certificate_id UUID;
  v_certificate_number TEXT;
  v_course_title TEXT;
  v_existing_cert UUID;
  v_site_url TEXT := 'https://nodo360.com'; -- Ajustar según ambiente
BEGIN
  -- Solo actuar cuando completed_at cambia de NULL a un valor
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN

    -- Verificar que el progreso sea realmente 100%
    IF NEW.progress_percentage < 100 THEN
      RETURN NEW;
    END IF;

    -- Verificar si ya existe un certificado de curso para este usuario/curso
    SELECT id INTO v_existing_cert
    FROM public.certificates
    WHERE user_id = NEW.user_id
      AND course_id = NEW.course_id
      AND type = 'course';

    -- Si ya existe, no crear duplicado
    IF v_existing_cert IS NOT NULL THEN
      RAISE NOTICE 'Certificado ya existe para usuario % y curso %', NEW.user_id, NEW.course_id;
      RETURN NEW;
    END IF;

    -- Obtener título del curso
    SELECT title INTO v_course_title
    FROM public.courses
    WHERE id = NEW.course_id;

    IF v_course_title IS NULL THEN
      RAISE NOTICE 'Curso no encontrado: %', NEW.course_id;
      RETURN NEW;
    END IF;

    -- Generar número de certificado único
    v_certificate_number := generate_certificate_number();

    -- Crear el certificado
    INSERT INTO public.certificates (
      user_id,
      course_id,
      module_id,
      type,
      certificate_number,
      title,
      description,
      verification_url,
      issued_at
    ) VALUES (
      NEW.user_id,
      NEW.course_id,
      NULL, -- NULL para certificados de curso
      'course',
      v_certificate_number,
      v_course_title,
      'Certificado de completación del curso',
      v_site_url || '/verificar/' || v_certificate_number,
      NOW()
    )
    RETURNING id INTO v_certificate_id;

    RAISE NOTICE 'Certificado creado: % para usuario % curso %',
      v_certificate_number, NEW.user_id, NEW.course_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: trigger_auto_certificate_on_completion
-- =====================================================
-- Se dispara cuando se actualiza course_enrollments

DROP TRIGGER IF EXISTS trigger_auto_certificate_on_completion ON public.course_enrollments;

CREATE TRIGGER trigger_auto_certificate_on_completion
  AFTER UPDATE OF completed_at ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_issue_course_certificate();

-- =====================================================
-- FUNCTION: issue_course_certificate_manual
-- =====================================================
-- Función para emitir certificado manualmente (útil para casos especiales)

CREATE OR REPLACE FUNCTION issue_course_certificate_manual(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_certificate_id UUID;
  v_certificate_number TEXT;
  v_course_title TEXT;
  v_existing_cert UUID;
  v_enrollment_exists BOOLEAN;
  v_site_url TEXT := 'https://nodo360.com';
BEGIN
  -- Verificar que el usuario está inscrito y ha completado el curso
  SELECT EXISTS(
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = p_user_id
      AND course_id = p_course_id
      AND (completed_at IS NOT NULL OR progress_percentage >= 100)
  ) INTO v_enrollment_exists;

  IF NOT v_enrollment_exists THEN
    RAISE EXCEPTION 'El usuario no ha completado este curso';
  END IF;

  -- Verificar si ya existe certificado
  SELECT id INTO v_existing_cert
  FROM public.certificates
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND type = 'course';

  IF v_existing_cert IS NOT NULL THEN
    RETURN v_existing_cert; -- Retornar el existente
  END IF;

  -- Obtener título del curso
  SELECT title INTO v_course_title
  FROM public.courses
  WHERE id = p_course_id;

  -- Generar número de certificado
  v_certificate_number := generate_certificate_number();

  -- Crear certificado
  INSERT INTO public.certificates (
    user_id,
    course_id,
    module_id,
    type,
    certificate_number,
    title,
    description,
    verification_url,
    issued_at
  ) VALUES (
    p_user_id,
    p_course_id,
    NULL,
    'course',
    v_certificate_number,
    v_course_title,
    'Certificado de completación del curso',
    v_site_url || '/verificar/' || v_certificate_number,
    NOW()
  )
  RETURNING id INTO v_certificate_id;

  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_user_certificates_summary
-- =====================================================
-- Obtiene un resumen de certificados del usuario

CREATE OR REPLACE FUNCTION get_user_certificates_summary(p_user_id UUID)
RETURNS TABLE (
  total_certificates BIGINT,
  course_certificates BIGINT,
  module_certificates BIGINT,
  latest_certificate_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_certificates,
    COUNT(*) FILTER (WHERE type = 'course')::BIGINT as course_certificates,
    COUNT(*) FILTER (WHERE type = 'module')::BIGINT as module_certificates,
    MAX(issued_at) as latest_certificate_date
  FROM public.certificates
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEX: Optimización de consultas de certificados
-- =====================================================

-- Índice para buscar certificados de curso por usuario
CREATE INDEX IF NOT EXISTS idx_certificates_user_course_type
  ON public.certificates(user_id, course_id, type);

-- Índice para verificación pública por número
CREATE INDEX IF NOT EXISTS idx_certificates_verification
  ON public.certificates(certificate_number)
  WHERE certificate_number IS NOT NULL;

-- =====================================================
-- BACKFILL: Generar certificados para cursos ya completados
-- =====================================================
-- Esta función genera certificados para estudiantes que ya
-- completaron cursos pero no tienen certificado.

CREATE OR REPLACE FUNCTION backfill_missing_certificates()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_enrollment RECORD;
  v_cert_id UUID;
BEGIN
  FOR v_enrollment IN
    SELECT ce.user_id, ce.course_id, c.title as course_title
    FROM public.course_enrollments ce
    JOIN public.courses c ON ce.course_id = c.id
    WHERE ce.completed_at IS NOT NULL
      AND ce.progress_percentage >= 100
      AND NOT EXISTS (
        SELECT 1 FROM public.certificates cert
        WHERE cert.user_id = ce.user_id
          AND cert.course_id = ce.course_id
          AND cert.type = 'course'
      )
  LOOP
    BEGIN
      v_cert_id := issue_course_certificate_manual(
        v_enrollment.user_id,
        v_enrollment.course_id
      );
      v_count := v_count + 1;
      RAISE NOTICE 'Certificado creado para usuario % curso %',
        v_enrollment.user_id, v_enrollment.course_title;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creando certificado para % - %: %',
        v_enrollment.user_id, v_enrollment.course_id, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIO: Para ejecutar el backfill manualmente:
-- SELECT backfill_missing_certificates();
-- =====================================================

-- =====================================================
-- GRANT: Permisos para funciones
-- =====================================================

GRANT EXECUTE ON FUNCTION auto_issue_course_certificate() TO authenticated;
GRANT EXECUTE ON FUNCTION issue_course_certificate_manual(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_certificates_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_missing_certificates() TO service_role;

-- =====================================================
-- COMPLETADO
-- =====================================================
-- Próximos pasos:
-- 1. Ejecutar: SELECT backfill_missing_certificates();
--    para generar certificados faltantes
-- 2. Los nuevos cursos completados generarán certificados
--    automáticamente via el trigger
-- =====================================================
