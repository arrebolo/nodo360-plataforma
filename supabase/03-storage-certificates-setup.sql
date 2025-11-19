-- =====================================================
-- NODO360 PLATFORM - CERTIFICATES STORAGE SETUP
-- =====================================================
-- Configuración de Supabase Storage para certificados PDF
-- Este script crea el bucket y las políticas de acceso
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

-- Crear bucket para certificados (público para descarga)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true, -- Público: cualquiera con el link puede descargar
  2097152, -- 2MB máximo por archivo
  ARRAY['application/pdf']::text[] -- Solo PDFs
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuarios pueden subir sus propios certificados" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver certificados" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios certificados" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios certificados" ON storage.objects;
DROP POLICY IF EXISTS "Admins pueden eliminar cualquier certificado" ON storage.objects;

-- =====================================================
-- POLICY: INSERT (Upload)
-- =====================================================

-- Solo usuarios autenticados pueden subir sus propios certificados
-- Estructura de path: certificates/{type}/{user_id}/{certificate_id}.pdf
CREATE POLICY "Usuarios pueden subir sus propios certificados"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[1] IN ('modules', 'courses') AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- =====================================================
-- POLICY: SELECT (Download/View)
-- =====================================================

-- Cualquiera puede ver/descargar certificados (con el link)
CREATE POLICY "Cualquiera puede ver certificados"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'certificates'
  );

-- =====================================================
-- POLICY: UPDATE
-- =====================================================

-- Solo el dueño puede actualizar sus certificados
CREATE POLICY "Usuarios pueden actualizar sus propios certificados"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- =====================================================
-- POLICY: DELETE
-- =====================================================

-- Solo el dueño puede eliminar sus certificados
CREATE POLICY "Usuarios pueden eliminar sus propios certificados"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins pueden eliminar cualquier certificado
CREATE POLICY "Admins pueden eliminar cualquier certificado"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificates' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- HELPER FUNCTION: Get Certificate Storage Path
-- =====================================================

CREATE OR REPLACE FUNCTION get_certificate_storage_path(
  p_user_id UUID,
  p_certificate_id UUID,
  p_type certificate_type
)
RETURNS TEXT AS $$
BEGIN
  -- Estructura: certificates/{type}/{user_id}/{certificate_id}.pdf
  -- Ejemplos:
  --   certificates/modules/abc-123/cert-456.pdf
  --   certificates/courses/abc-123/cert-789.pdf

  IF p_type = 'module' THEN
    RETURN 'modules/' || p_user_id::text || '/' || p_certificate_id::text || '.pdf';
  ELSIF p_type = 'course' THEN
    RETURN 'courses/' || p_user_id::text || '/' || p_certificate_id::text || '.pdf';
  ELSE
    RAISE EXCEPTION 'Invalid certificate type: %', p_type;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- HELPER FUNCTION: Get Public Certificate URL
-- =====================================================

CREATE OR REPLACE FUNCTION get_certificate_public_url(
  p_certificate_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_type certificate_type;
  v_path TEXT;
  v_bucket_url TEXT;
BEGIN
  -- Obtener user_id y type del certificado
  SELECT user_id, type INTO v_user_id, v_type
  FROM public.certificates
  WHERE id = p_certificate_id;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Construir path
  v_path := get_certificate_storage_path(v_user_id, p_certificate_id, v_type);

  -- Construir URL pública
  -- Formato: https://{project_ref}.supabase.co/storage/v1/object/public/certificates/{path}
  -- Nota: Esto debe ser configurado con la URL real de tu proyecto
  v_bucket_url := current_setting('app.settings.supabase_url', true);

  IF v_bucket_url IS NULL OR v_bucket_url = '' THEN
    -- Fallback: construir manualmente (reemplazar con tu project ref)
    RETURN 'https://your-project-ref.supabase.co/storage/v1/object/public/certificates/' || v_path;
  ELSE
    RETURN v_bucket_url || '/storage/v1/object/public/certificates/' || v_path;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- UPDATE TRIGGER: Auto-update certificate_url
-- =====================================================

CREATE OR REPLACE FUNCTION update_certificate_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no tiene URL, intentar construirla automáticamente
  IF NEW.certificate_url IS NULL THEN
    NEW.certificate_url := get_certificate_public_url(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Solo crear trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auto_update_certificate_url'
  ) THEN
    CREATE TRIGGER auto_update_certificate_url
      BEFORE INSERT OR UPDATE ON public.certificates
      FOR EACH ROW
      EXECUTE FUNCTION update_certificate_url();
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verificar que el bucket fue creado
DO $$
DECLARE
  v_bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'certificates'
  ) INTO v_bucket_exists;

  IF v_bucket_exists THEN
    RAISE NOTICE '✅ Bucket "certificates" creado exitosamente';
  ELSE
    RAISE WARNING '❌ Bucket "certificates" NO fue creado';
  END IF;
END $$;

-- Verificar políticas creadas
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%certificado%';

  RAISE NOTICE '✅ % políticas de storage creadas', v_policy_count;
END $$;

-- Listar todas las políticas del bucket
SELECT
  policyname as "Política",
  cmd as "Operación",
  CASE
    WHEN roles::text LIKE '%authenticated%' THEN 'Autenticados'
    WHEN roles::text LIKE '%public%' THEN 'Público'
    ELSE roles::text
  END as "Roles"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%certificado%'
ORDER BY cmd, policyname;

-- =====================================================
-- CONFIGURATION SUMMARY
-- =====================================================

/*
📋 RESUMEN DE CONFIGURACIÓN:

✅ Bucket: certificates
   - Público: Sí (para descarga con link)
   - Tamaño máximo: 2MB por archivo
   - Tipos permitidos: application/pdf

✅ Estructura de carpetas:
   certificates/
   ├── modules/
   │   └── {user_id}/
   │       └── {certificate_id}.pdf
   └── courses/
       └── {user_id}/
           └── {certificate_id}.pdf

✅ Políticas de acceso:
   - INSERT: Solo usuarios autenticados (sus propios certificados)
   - SELECT: Público (cualquiera con el link)
   - UPDATE: Solo el dueño
   - DELETE: Dueño o admins

✅ Funciones helper:
   - get_certificate_storage_path(): Construye path del archivo
   - get_certificate_public_url(): Obtiene URL pública
   - update_certificate_url(): Trigger automático para actualizar URLs

📌 PRÓXIMOS PASOS:

1. Aplicar este script en Supabase Dashboard → SQL Editor
2. Verificar que el bucket aparece en Storage → Buckets
3. Verificar políticas en Storage → Policies
4. Obtener la URL de tu proyecto para configurar las URLs públicas
5. Actualizar la función get_certificate_public_url() con tu project_ref

🔗 URL pública de certificados:
   https://YOUR-PROJECT-REF.supabase.co/storage/v1/object/public/certificates/{path}

⚠️ IMPORTANTE:
   - Reemplaza 'your-project-ref' con tu project reference real
   - Puedes obtenerlo de: Settings → API → Project URL
   - Ejemplo: https://abcdefghijklmnop.supabase.co
*/

-- =====================================================
-- COMPLETED
-- =====================================================
-- Storage setup completado exitosamente!
-- Ver STORAGE_SETUP.md para instrucciones de uso
-- =====================================================
