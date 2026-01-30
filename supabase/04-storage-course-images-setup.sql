-- =====================================================
-- NODO360 PLATFORM - COURSE IMAGES STORAGE SETUP
-- =====================================================
-- Configuracion de Supabase Storage para imagenes de cursos
-- Este script crea el bucket y las politicas de acceso
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

-- Crear bucket para imagenes de cursos (publico para visualizacion)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true, -- Publico: cualquiera puede ver las imagenes
  2097152, -- 2MB maximo por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[] -- Solo imagenes
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Instructores pueden subir imagenes de cursos" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver imagenes de cursos" ON storage.objects;
DROP POLICY IF EXISTS "Instructores pueden actualizar sus imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Instructores pueden eliminar sus imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Admins pueden gestionar imagenes de cursos" ON storage.objects;

-- =====================================================
-- POLICY: INSERT (Upload)
-- =====================================================

-- Instructores y admins pueden subir imagenes
-- Estructura de path: courses/{course_slug}/thumbnails|banners/{filename}
CREATE POLICY "Instructores pueden subir imagenes de cursos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('instructor', 'admin')
    )
  );

-- =====================================================
-- POLICY: SELECT (View/Download)
-- =====================================================

-- Cualquiera puede ver imagenes de cursos (publicas)
CREATE POLICY "Cualquiera puede ver imagenes de cursos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'course-images'
  );

-- =====================================================
-- POLICY: UPDATE
-- =====================================================

-- Instructores pueden actualizar imagenes
CREATE POLICY "Instructores pueden actualizar sus imagenes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('instructor', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'course-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('instructor', 'admin')
    )
  );

-- =====================================================
-- POLICY: DELETE
-- =====================================================

-- Instructores pueden eliminar imagenes
CREATE POLICY "Instructores pueden eliminar sus imagenes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-images' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('instructor', 'admin')
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verificar que el bucket fue creado
DO $$
DECLARE
  v_bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'course-images'
  ) INTO v_bucket_exists;

  IF v_bucket_exists THEN
    RAISE NOTICE 'Bucket "course-images" creado exitosamente';
  ELSE
    RAISE WARNING 'Bucket "course-images" NO fue creado';
  END IF;
END $$;

-- Verificar politicas creadas
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%imagenes de cursos%' OR policyname LIKE '%sus imagenes%';

  RAISE NOTICE '% politicas de storage creadas para course-images', v_policy_count;
END $$;

-- Listar todas las politicas del bucket
SELECT
  policyname as "Politica",
  cmd as "Operacion",
  CASE
    WHEN roles::text LIKE '%authenticated%' THEN 'Autenticados'
    WHEN roles::text LIKE '%public%' THEN 'Publico'
    ELSE roles::text
  END as "Roles"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname LIKE '%imagenes de cursos%' OR policyname LIKE '%sus imagenes%')
ORDER BY cmd, policyname;

-- =====================================================
-- CONFIGURATION SUMMARY
-- =====================================================

/*
RESUMEN DE CONFIGURACION:

Bucket: course-images
   - Publico: Si (para visualizacion de thumbnails/banners)
   - Tamano maximo: 2MB por archivo
   - Tipos permitidos: image/jpeg, image/png, image/webp

Estructura de carpetas:
   course-images/
   └── courses/
       └── {course_slug}/
           ├── thumbnails/
           │   └── {timestamp}-{random}.{ext}
           └── banners/
               └── {timestamp}-{random}.{ext}

Politicas de acceso:
   - INSERT: Solo instructores y admins
   - SELECT: Publico (cualquiera puede ver)
   - UPDATE: Solo instructores y admins
   - DELETE: Solo instructores y admins

PROXIMOS PASOS:

1. Aplicar este script en Supabase Dashboard → SQL Editor
2. Verificar que el bucket aparece en Storage → Buckets
3. Verificar politicas en Storage → Policies

URL publica de imagenes:
   https://YOUR-PROJECT-REF.supabase.co/storage/v1/object/public/course-images/{path}

IMPORTANTE:
   - Si el bucket ya existe pero sin politicas, las politicas se crearan
   - Si el bucket existe con diferentes settings, se actualizaran
*/

-- =====================================================
-- COMPLETED
-- =====================================================
-- Storage setup para course-images completado!
-- =====================================================
