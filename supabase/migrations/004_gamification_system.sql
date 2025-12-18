-- 003_learning_paths.sql
-- Sistema de Rutas de Aprendizaje para Nodo360

-- Asegurar extensión para UUID (por si acaso)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1. TABLA: learning_paths
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  difficulty text,
  estimated_hours integer,
  order_index integer NOT NULL,
  color_from text,
  color_to text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

----------------------------------------------------
-- 2. TABLA: path_courses  (cursos que pertenecen a cada ruta)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.path_courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT path_courses_path_id_order_index_key UNIQUE (path_id, order_index)
);

----------------------------------------------------
-- 3. TABLA: user_selected_paths  (ruta elegida por cada usuario)
----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_selected_paths (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice útil para consultas por usuario + rutas activas
CREATE INDEX IF NOT EXISTS idx_user_paths_active
  ON public.user_selected_paths(user_id, is_active);

----------------------------------------------------
-- 4. SEED: Rutas de aprendizaje
----------------------------------------------------
INSERT INTO public.learning_paths
  (slug, title, description, icon, difficulty, estimated_hours, order_index, color_from, color_to, is_active)
VALUES
  (
    'bitcoin-fundamentals',
    'Ruta Bitcoin Básica',
    'Aprende los fundamentos de Bitcoin y las criptomonedas principales.',
    '₿',
    'beginner',
    3,
    1,
    '#f97316',
    '#facc15',
    true
  ),
  (
    'crypto-full-stack',
    'Ruta Crypto Full-Stack',
    'Itinerario completo que agrupa todos los cursos publicados relacionados con cripto.',
    '⚡',
    'intermediate',
    8,
    2,
    '#22c55e',
    '#0ea5e9',
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  title            = EXCLUDED.title,
  description      = EXCLUDED.description,
  icon             = EXCLUDED.icon,
  difficulty       = EXCLUDED.difficulty,
  estimated_hours  = EXCLUDED.estimated_hours,
  order_index      = EXCLUDED.order_index,
  color_from       = EXCLUDED.color_from,
  color_to         = EXCLUDED.color_to,
  is_active        = EXCLUDED.is_active;

----------------------------------------------------
-- 5. ASIGNAR CURSOS A RUTA BITCOIN
--    (si los slugs no existen simplemente no insertará nada)
----------------------------------------------------
INSERT INTO public.path_courses (path_id, course_id, order_index, is_required)
SELECT
  lp.id,
  c.id,
  ROW_NUMBER() OVER (ORDER BY c.created_at),
  true
FROM public.learning_paths lp
JOIN public.courses c
  ON c.slug IN (
    'introduccion-a-las-criptomonedas',
    'seguridad-en-crypto-primeros-pasos',
    'bitcoin-para-principiantes'
  )
WHERE lp.slug = 'bitcoin-fundamentals'
  AND c.status = 'published'
ON CONFLICT (path_id, order_index) DO NOTHING;

----------------------------------------------------
-- 6. ASIGNAR TODOS LOS CURSOS PUBLICADOS A RUTA CRYPTO FULL-STACK
----------------------------------------------------
INSERT INTO public.path_courses (path_id, course_id, order_index, is_required)
SELECT
  lp.id,
  c.id,
  ROW_NUMBER() OVER (ORDER BY c.created_at),
  true
FROM public.learning_paths lp
JOIN public.courses c
  ON c.status = 'published'
WHERE lp.slug = 'crypto-full-stack'
ON CONFLICT (path_id, order_index) DO NOTHING;
