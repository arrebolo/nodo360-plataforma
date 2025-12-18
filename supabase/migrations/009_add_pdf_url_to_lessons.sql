-- =====================================================
-- MIGRACIÓN 009: Añadir campo pdf_url a lessons
-- =====================================================
-- Fecha: 2025-12-11
-- Descripción: Añade columna para almacenar URL de PDF/documento
-- =====================================================

-- Añadir columna pdf_url a la tabla lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Comentario
COMMENT ON COLUMN public.lessons.pdf_url IS 'URL a PDF o documento descargable (Drive, Dropbox, etc.)';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
