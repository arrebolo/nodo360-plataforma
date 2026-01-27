-- =====================================================
-- MIGRATION 013: Sistema de Aprobación de Cursos
-- =====================================================
-- Añade soporte para el flujo de aprobación de cursos:
-- - Nuevos estados: pending_review, rejected
-- - Campo rejection_reason para almacenar motivo de rechazo
-- =====================================================

-- Añadir campo rejection_reason a courses
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comentario para el campo
COMMENT ON COLUMN public.courses.rejection_reason IS 'Motivo de rechazo cuando status = rejected';

-- Crear índice para buscar cursos pendientes de revisión
CREATE INDEX IF NOT EXISTS idx_courses_pending_review
ON public.courses(status, updated_at)
WHERE status = 'pending_review';

-- =====================================================
-- NOTA: Los estados de curso soportados son:
-- - draft: Borrador (instructor trabajando)
-- - pending_review: Enviado a revisión (esperando admin)
-- - published: Publicado (visible al público)
-- - rejected: Rechazado (instructor debe corregir)
-- - archived: Archivado
-- - coming_soon: Próximamente
-- =====================================================

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 013: Course approval system completed';
END $$;
