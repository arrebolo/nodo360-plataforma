-- ================================================
-- SISTEMA DE RUTAS DE APRENDIZAJE - NODO360
-- ================================================

-- 1. TABLA: learning_paths
-- Rutas de aprendizaje disponibles (Bitcoin, Ethereum, Full-Stack)
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji o nombre de icono
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  order_index INTEGER NOT NULL,
  color_from TEXT, -- Color inicial del gradiente (ej: 'orange-500')
  color_to TEXT, -- Color final del gradiente (ej: 'yellow-500')
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. TABLA: path_courses
-- Cursos que pertenecen a cada ruta (con orden específico)
CREATE TABLE IF NOT EXISTS public.path_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true, -- Si es obligatorio para completar la ruta
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Un curso solo puede estar una vez en cada ruta
  UNIQUE(path_id, course_id),
  -- El order_index debe ser único dentro de cada ruta
  UNIQUE(path_id, order_index)
);

-- 3. TABLA: user_selected_paths
-- Rutas seleccionadas por cada usuario
CREATE TABLE IF NOT EXISTS public.user_selected_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ, -- Cuando el usuario completa toda la ruta
  is_active BOOLEAN DEFAULT true, -- Usuario puede tener múltiples rutas, pero una activa
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Un usuario puede tener la misma ruta solo una vez
  UNIQUE(user_id, path_id)
);

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================

CREATE INDEX IF NOT EXISTS idx_path_courses_path ON public.path_courses(path_id);
CREATE INDEX IF NOT EXISTS idx_path_courses_course ON public.path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_paths_user ON public.user_selected_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_user_paths_active ON public.user_selected_paths(user_id, is_active);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_selected_paths ENABLE ROW LEVEL SECURITY;

-- Políticas: learning_paths (todos pueden ver rutas activas)
DROP POLICY IF EXISTS "Anyone can view active learning paths" ON public.learning_paths;
CREATE POLICY "Anyone can view active learning paths"
  ON public.learning_paths FOR SELECT
  USING (is_active = true);

-- Políticas: path_courses (todos pueden ver qué cursos tiene cada ruta)
DROP POLICY IF EXISTS "Anyone can view path courses" ON public.path_courses;
CREATE POLICY "Anyone can view path courses"
  ON public.path_courses FOR SELECT
  USING (true);

-- Políticas: user_selected_paths (usuarios solo ven sus propias rutas)
DROP POLICY IF EXISTS "Users can view own selected paths" ON public.user_selected_paths;
CREATE POLICY "Users can view own selected paths"
  ON public.user_selected_paths FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select paths" ON public.user_selected_paths;
CREATE POLICY "Users can select paths"
  ON public.user_selected_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own paths" ON public.user_selected_paths;
CREATE POLICY "Users can update own paths"
  ON public.user_selected_paths FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================
-- DATOS INICIALES: 3 RUTAS PRINCIPALES
-- ================================================

INSERT INTO public.learning_paths (slug, title, description, icon, difficulty, estimated_hours, order_index, color_from, color_to) VALUES
('bitcoin-fundamentals', 'Ruta Bitcoin', 'Domina Bitcoin desde los fundamentos hasta conceptos avanzados. Ideal para comenzar en el mundo crypto.', '₿', 'beginner', 40, 1, 'orange-500', 'yellow-500'),
('ethereum-developer', 'Ruta Ethereum', 'Conviértete en desarrollador blockchain. Aprende Solidity, smart contracts y dApps.', '⟠', 'intermediate', 60, 2, 'purple-500', 'blue-500'),
('crypto-full-stack', 'Ruta Full-Stack Crypto', 'Stack completo de desarrollo blockchain. De Bitcoin a dApps avanzadas en múltiples blockchains.', '🚀', 'advanced', 100, 3, 'green-500', 'teal-500')
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- ASIGNAR CURSOS A RUTAS
-- ================================================

-- Ruta Bitcoin: Asignar cursos relacionados con Bitcoin
INSERT INTO public.path_courses (path_id, course_id, order_index, is_required)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'bitcoin-fundamentals'),
  c.id,
  ROW_NUMBER() OVER (ORDER BY c.created_at) - 1
FROM courses c
WHERE c.slug IN ('bitcoin-para-principiantes', 'introduccion-criptomonedas', 'bitcoin-desde-cero')
  AND c.status = 'published'
ON CONFLICT (path_id, course_id) DO NOTHING;

-- Ruta Ethereum: Por ahora vacía (se llenará cuando haya cursos de Ethereum)
-- Se puede agregar manualmente después

-- Ruta Full-Stack: Incluye todos los cursos publicados
INSERT INTO public.path_courses (path_id, course_id, order_index, is_required)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'crypto-full-stack'),
  c.id,
  ROW_NUMBER() OVER (ORDER BY c.created_at) - 1
FROM courses c
WHERE c.status = 'published'
ON CONFLICT (path_id, course_id) DO NOTHING;

-- ================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ================================================

COMMENT ON TABLE public.learning_paths IS 'Rutas de aprendizaje disponibles en la plataforma';
COMMENT ON TABLE public.path_courses IS 'Cursos que pertenecen a cada ruta de aprendizaje';
COMMENT ON TABLE public.user_selected_paths IS 'Rutas seleccionadas por cada usuario';

COMMENT ON COLUMN public.learning_paths.estimated_hours IS 'Horas estimadas para completar toda la ruta';
COMMENT ON COLUMN public.path_courses.is_required IS 'Si el curso es obligatorio para completar la ruta';
COMMENT ON COLUMN public.user_selected_paths.is_active IS 'Si esta es la ruta activa del usuario (solo una puede estar activa)';
