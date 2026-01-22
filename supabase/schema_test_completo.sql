-- =====================================================
-- NODO360 PLATFORM - SCHEMA COMPLETO PARA TEST
-- =====================================================
-- Archivo generado combinando todas las migraciones.
-- Contiene TODAS las tablas, funciones, triggers y políticas RLS.
--
-- FUENTES (en orden):
--   1. supabase/schema.sql
--   2. supabase/migrations/003_learning_paths.sql
--   3. supabase/migrations/004_gamification_system.sql
--   4. supabase/migrations/005_user_lesson_notes_and_final_quiz.sql
--   5. supabase/migrations/006_course_counters_triggers.sql
--   6. scripts/add-governance-system.sql
--   7. scripts/add-user-roles-system.sql
--   8. supabase/04-migration-enrollments.sql
--   9. supabase/migration-quiz-certificates.sql
--
-- INSTRUCCIONES:
--   1. Abre Supabase Dashboard (o entorno de test)
--   2. Ve a SQL Editor
--   3. Ejecuta este archivo completo
-- =====================================================


-- #####################################################
-- SECCIÓN 1: EXTENSIONES
-- #####################################################

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- #####################################################
-- SECCIÓN 2: TIPOS / ENUMS
-- #####################################################

-- User role enum (extendido con roles de gobernanza)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'user',
        'student',
        'instructor',
        'candidate_mentor',
        'mentor',
        'admin',
        'council'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Course level enum
DO $$ BEGIN
    CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Course status enum
DO $$ BEGIN
    CREATE TYPE course_status AS ENUM ('draft', 'published', 'coming_soon', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Certificate type enum
DO $$ BEGIN
    CREATE TYPE certificate_type AS ENUM ('module', 'course');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- #####################################################
-- SECCIÓN 3: FUNCIONES UTILITARIAS (previas a tablas)
-- #####################################################

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- #####################################################
-- SECCIÓN 4: TABLAS BASE
-- #####################################################

-- =====================================================
-- TABLE: users (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student' NOT NULL,
  bio TEXT,
  website TEXT,
  twitter_handle TEXT,
  github_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =====================================================
-- TABLE: courses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  level course_level DEFAULT 'beginner' NOT NULL,
  status course_status DEFAULT 'draft' NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_free ON public.courses(is_free);

-- =====================================================
-- TABLE: modules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  total_lessons INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  requires_quiz BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(course_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_modules_requires_quiz ON public.modules(requires_quiz) WHERE requires_quiz = true;

-- =====================================================
-- TABLE: lessons
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  content TEXT,
  video_url TEXT,
  video_duration_minutes INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(module_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons(module_id, slug);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON public.lessons(module_id, order_index);

-- =====================================================
-- TABLE: user_progress
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(user_id, is_completed);

-- =====================================================
-- TABLE: bookmarks
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_lesson_id ON public.bookmarks(lesson_id);

-- =====================================================
-- TABLE: notes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  video_timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_lesson_id ON public.notes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_lesson ON public.notes(user_id, lesson_id);


-- #####################################################
-- SECCIÓN 5: TABLAS DE RUTAS DE APRENDIZAJE
-- (Fuente: 003_learning_paths.sql)
-- #####################################################

-- =====================================================
-- TABLE: learning_paths
-- =====================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  long_description TEXT,
  icon TEXT,
  emoji TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  position INTEGER DEFAULT 0,
  color_from TEXT,
  color_to TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLE: learning_path_courses (junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.learning_path_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(learning_path_id, course_id)
);

-- =====================================================
-- TABLE: path_courses (legacy junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.path_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(path_id, course_id),
  UNIQUE(path_id, order_index)
);

-- =====================================================
-- TABLE: user_selected_paths
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_selected_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_path_courses_path ON public.path_courses(path_id);
CREATE INDEX IF NOT EXISTS idx_path_courses_course ON public.path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path ON public.learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_course ON public.learning_path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_paths_user ON public.user_selected_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_user_paths_active ON public.user_selected_paths(user_id, is_active);


-- #####################################################
-- SECCIÓN 6: TABLAS DE GAMIFICACIÓN
-- (Fuente: 004_gamification_system.sql)
-- #####################################################

-- =====================================================
-- TABLE: user_gamification_stats
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,
  xp_to_next_level INTEGER DEFAULT 100 NOT NULL,
  total_badges INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT positive_xp CHECK (total_xp >= 0),
  CONSTRAINT positive_level CHECK (current_level >= 1),
  CONSTRAINT positive_streak CHECK (current_streak >= 0)
);

-- =====================================================
-- TABLE: xp_events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  related_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT positive_xp_earned CHECK (xp_earned > 0)
);

-- =====================================================
-- TABLE: badges
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT positive_requirement CHECK (requirement_value > 0)
);

-- =====================================================
-- TABLE: user_badges
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_gamification_user ON public.user_gamification_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON public.xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked ON public.user_badges(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON public.user_gamification_stats(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_xp ON public.user_gamification_stats(total_xp DESC);


-- #####################################################
-- SECCIÓN 7: TABLAS DE NOTAS Y QUIZ FINAL DE CURSO
-- (Fuente: 005_user_lesson_notes_and_final_quiz.sql)
-- #####################################################

-- =====================================================
-- TABLE: user_lesson_notes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_notes_user ON public.user_lesson_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_notes_lesson ON public.user_lesson_notes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_notes_course ON public.user_lesson_notes(course_id);

-- =====================================================
-- TABLE: course_final_quiz_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_final_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_final_attempts_user ON public.course_final_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_course_final_attempts_course ON public.course_final_quiz_attempts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_final_attempts_completed ON public.course_final_quiz_attempts(completed_at DESC);


-- #####################################################
-- SECCIÓN 8: TABLAS DE GOBERNANZA
-- (Fuente: add-governance-system.sql)
-- #####################################################

-- =====================================================
-- TABLE: governance_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.governance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#ff6b35',
  proposal_level INTEGER DEFAULT 1 CHECK (proposal_level IN (1, 2)),
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: governance_proposals
-- =====================================================
CREATE TABLE IF NOT EXISTS public.governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  detailed_content TEXT,
  category_id UUID REFERENCES public.governance_categories(id),
  proposal_level INTEGER NOT NULL DEFAULT 1 CHECK (proposal_level IN (1, 2)),
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_review', 'active', 'passed', 'rejected', 'implemented', 'cancelled'
  )),
  validated_by UUID REFERENCES public.users(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  voting_starts_at TIMESTAMPTZ,
  voting_ends_at TIMESTAMPTZ,
  quorum_required INTEGER DEFAULT 10,
  approval_threshold DECIMAL(3,2) DEFAULT 0.60,
  total_votes INTEGER DEFAULT 0,
  total_gpower_for DECIMAL(12,2) DEFAULT 0,
  total_gpower_against DECIMAL(12,2) DEFAULT 0,
  total_gpower_abstain DECIMAL(12,2) DEFAULT 0,
  implemented_at TIMESTAMPTZ,
  implementation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: governance_votes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.governance_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.governance_proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
  gpower_used DECIMAL(10,2) NOT NULL,
  xp_at_vote INTEGER NOT NULL,
  reputation_at_vote INTEGER DEFAULT 0,
  badges_count_at_vote INTEGER DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)
);

-- =====================================================
-- TABLE: user_reputation
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reputation_points INTEGER DEFAULT 0,
  proposals_created INTEGER DEFAULT 0,
  proposals_passed INTEGER DEFAULT 0,
  votes_cast INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  mentoring_sessions INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: reputation_history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  related_proposal_id UUID REFERENCES public.governance_proposals(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_author ON public.governance_proposals(author_id);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON public.governance_proposals(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_level ON public.governance_proposals(proposal_level);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_dates ON public.governance_proposals(voting_starts_at, voting_ends_at);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON public.governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.governance_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_reputation_user ON public.user_reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_points ON public.user_reputation(reputation_points DESC);


-- #####################################################
-- SECCIÓN 9: TABLA DE ROLES EXTENDIDOS
-- (Fuente: add-user-roles-system.sql)
-- #####################################################

-- =====================================================
-- TABLE: user_roles
-- =====================================================
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
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);


-- #####################################################
-- SECCIÓN 10: TABLA DE ENROLLMENTS
-- (Fuente: 04-migration-enrollments.sql)
-- #####################################################

-- =====================================================
-- TABLE: course_enrollments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON public.course_enrollments(user_id, completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_last_accessed ON public.course_enrollments(user_id, last_accessed_at DESC);


-- #####################################################
-- SECCIÓN 11: TABLAS DE QUIZ Y CERTIFICADOS
-- (Fuente: migration-quiz-certificates.sql)
-- #####################################################

-- =====================================================
-- TABLE: quiz_questions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  explanation TEXT,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_correct_answer CHECK (correct_answer >= 0 AND correct_answer <= 3),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2 AND jsonb_array_length(options) <= 4),
  CONSTRAINT unique_question_order UNIQUE (module_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_module ON public.quiz_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON public.quiz_questions(module_id, order_index);

-- =====================================================
-- TABLE: quiz_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_module ON public.quiz_attempts(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_module ON public.quiz_attempts(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON public.quiz_attempts(completed_at DESC);

-- =====================================================
-- TABLE: certificates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  type certificate_type NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  certificate_url TEXT,
  certificate_hash TEXT,
  nft_token_id TEXT,
  nft_contract_address TEXT,
  nft_chain TEXT,
  nft_tx_hash TEXT,
  verification_url TEXT,
  qr_code_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  CONSTRAINT certificate_type_check CHECK (
    (type = 'module' AND module_id IS NOT NULL) OR
    (type = 'course' AND module_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_module ON public.certificates(module_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_issued ON public.certificates(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_nft ON public.certificates(nft_token_id) WHERE nft_token_id IS NOT NULL;


-- #####################################################
-- SECCIÓN 12: FUNCIONES
-- #####################################################

-- =====================================================
-- Función: handle_new_user (crear perfil al registrarse)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Funciones de Gamificación: Cálculo de nivel
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  level INTEGER := 1;
  xp_required INTEGER := 100;
  xp_remaining INTEGER := xp;
BEGIN
  WHILE xp_remaining >= xp_required LOOP
    xp_remaining := xp_remaining - xp_required;
    level := level + 1;
    xp_required := 100 + ((level - 1) * 50);
  END LOOP;
  RETURN level;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_xp_to_next_level(current_xp INTEGER, current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  xp_for_level INTEGER := 100 + ((current_level - 1) * 50);
  xp_in_current_level INTEGER;
  total_xp_for_levels INTEGER := 0;
BEGIN
  FOR i IN 1..(current_level - 1) LOOP
    total_xp_for_levels := total_xp_for_levels + (100 + ((i - 1) * 50));
  END LOOP;
  xp_in_current_level := current_xp - total_xp_for_levels;
  RETURN xp_for_level - xp_in_current_level;
END;
$$;

-- =====================================================
-- Funciones de Gamificación: Update stats on XP
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_stats_on_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
  new_xp_to_next INTEGER;
BEGIN
  UPDATE user_gamification_stats
  SET total_xp = total_xp + NEW.xp_earned, updated_at = NOW()
  WHERE user_id = NEW.user_id
  RETURNING total_xp INTO new_total_xp;

  new_level := calculate_level_from_xp(new_total_xp);
  new_xp_to_next := calculate_xp_to_next_level(new_total_xp, new_level);

  UPDATE user_gamification_stats
  SET current_level = new_level, xp_to_next_level = new_xp_to_next, updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- =====================================================
-- Funciones de Gamificación: Crear stats al crear usuario
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_gamification_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =====================================================
-- Funciones de Gamificación: Otorgar XP al completar lección
-- =====================================================
CREATE OR REPLACE FUNCTION award_xp_on_lesson_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    INSERT INTO xp_events (user_id, event_type, xp_earned, related_id, description)
    VALUES (NEW.user_id, 'lesson_completed', 10, NEW.lesson_id, 'Lección completada');
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- Funciones de Gamificación: Verificar y otorgar badges
-- =====================================================
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_stats RECORD;
  badge RECORD;
  lessons_completed INTEGER;
  courses_completed INTEGER;
BEGIN
  SELECT * INTO user_stats FROM user_gamification_stats WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COUNT(*) INTO lessons_completed FROM user_progress WHERE user_id = p_user_id AND is_completed = true;
  courses_completed := 0;

  FOR badge IN
    SELECT b.* FROM badges b
    WHERE b.is_active = true
    AND NOT EXISTS (SELECT 1 FROM user_badges ub WHERE ub.user_id = p_user_id AND ub.badge_id = b.id)
  LOOP
    DECLARE
      should_award BOOLEAN := false;
    BEGIN
      CASE badge.requirement_type
        WHEN 'lessons_completed' THEN should_award := lessons_completed >= badge.requirement_value;
        WHEN 'courses_completed' THEN should_award := courses_completed >= badge.requirement_value;
        WHEN 'streak_days' THEN should_award := user_stats.current_streak >= badge.requirement_value;
        WHEN 'total_xp' THEN should_award := user_stats.total_xp >= badge.requirement_value;
      END CASE;

      IF should_award THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge.id) ON CONFLICT DO NOTHING;
        UPDATE user_gamification_stats SET total_badges = total_badges + 1 WHERE user_id = p_user_id;
        IF badge.xp_reward > 0 THEN
          INSERT INTO xp_events (user_id, event_type, xp_earned, related_id, description)
          VALUES (p_user_id, 'badge_unlocked', badge.xp_reward, badge.id, 'Badge desbloqueado: ' || badge.title);
        END IF;
      END IF;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION check_badges_on_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

-- =====================================================
-- Funciones de Contadores: Módulos y Lecciones
-- (Fuente: 006_course_counters_triggers.sql)
-- =====================================================
CREATE OR REPLACE FUNCTION update_course_module_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses SET total_modules = total_modules + 1, updated_at = NOW() WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses SET total_modules = GREATEST(0, total_modules - 1), updated_at = NOW() WHERE id = OLD.course_id;
    UPDATE public.courses SET total_lessons = GREATEST(0, total_lessons - COALESCE(OLD.total_lessons, 0)) WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_lesson_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT course_id INTO v_course_id FROM public.modules WHERE id = NEW.module_id;
    UPDATE public.modules SET total_lessons = total_lessons + 1, updated_at = NOW() WHERE id = NEW.module_id;
    UPDATE public.courses SET total_lessons = total_lessons + 1, updated_at = NOW() WHERE id = v_course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT course_id INTO v_course_id FROM public.modules WHERE id = OLD.module_id;
    UPDATE public.modules SET total_lessons = GREATEST(0, total_lessons - 1), updated_at = NOW() WHERE id = OLD.module_id;
    UPDATE public.courses SET total_lessons = GREATEST(0, total_lessons - 1), updated_at = NOW() WHERE id = v_course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Funciones de Enrollments
-- =====================================================
CREATE OR REPLACE FUNCTION update_course_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses SET enrolled_count = enrolled_count + 1 WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses SET enrolled_count = GREATEST(0, enrolled_count - 1) WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_enrollment_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress_percentage IS DISTINCT FROM OLD.progress_percentage THEN
    NEW.last_accessed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Funciones de Gobernanza: gPower
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_gpower(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_xp INTEGER;
  v_reputation INTEGER;
  v_badges_count INTEGER;
  v_gpower DECIMAL(10,2);
BEGIN
  SELECT COALESCE(total_xp, 0) INTO v_xp FROM public.user_gamification_stats WHERE user_id = p_user_id;
  SELECT COALESCE(reputation_points, 0) INTO v_reputation FROM public.user_reputation WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_badges_count FROM public.user_badges WHERE user_id = p_user_id;

  v_gpower := (COALESCE(v_xp, 0)::DECIMAL / 100 * 0.4) +
              (COALESCE(v_reputation, 0)::DECIMAL / 10 * 0.4) +
              (COALESCE(v_badges_count, 0)::DECIMAL * 10 * 0.2);

  IF v_gpower < 1 AND (v_xp > 0 OR v_reputation > 0 OR v_badges_count > 0) THEN
    v_gpower := 1;
  END IF;

  RETURN ROUND(v_gpower, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_create_proposal(p_user_id UUID, p_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_xp INTEGER;
  v_role TEXT;
BEGIN
  SELECT COALESCE(gs.total_xp, 0), u.role INTO v_xp, v_role
  FROM public.users u LEFT JOIN public.user_gamification_stats gs ON gs.user_id = u.id
  WHERE u.id = p_user_id;

  IF p_level = 1 THEN RETURN v_xp >= 50; END IF;
  IF p_level = 2 THEN RETURN v_role IN ('mentor', 'admin', 'council'); END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_validate_proposal(p_user_id UUID, p_proposal_level INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = p_user_id;
  IF p_proposal_level = 1 THEN RETURN v_role IN ('mentor', 'admin', 'council'); END IF;
  IF p_proposal_level = 2 THEN RETURN v_role IN ('admin', 'council'); END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.governance_proposals
    SET
      total_votes = total_votes + 1,
      total_gpower_for = CASE WHEN NEW.vote = 'for' THEN total_gpower_for + NEW.gpower_used ELSE total_gpower_for END,
      total_gpower_against = CASE WHEN NEW.vote = 'against' THEN total_gpower_against + NEW.gpower_used ELSE total_gpower_against END,
      total_gpower_abstain = CASE WHEN NEW.vote = 'abstain' THEN total_gpower_abstain + NEW.gpower_used ELSE total_gpower_abstain END,
      updated_at = NOW()
    WHERE id = NEW.proposal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_reputation_on_proposal_pass()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'passed' AND OLD.status = 'active' THEN
    INSERT INTO public.user_reputation (user_id, reputation_points, proposals_passed)
    VALUES (NEW.author_id, 50, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      reputation_points = user_reputation.reputation_points + 50,
      proposals_passed = user_reputation.proposals_passed + 1,
      updated_at = NOW();

    INSERT INTO public.reputation_history (user_id, change_amount, reason, related_proposal_id)
    VALUES (NEW.author_id, 50, 'Propuesta aprobada: ' || NEW.title, NEW.id);

    INSERT INTO public.reputation_history (user_id, change_amount, reason, related_proposal_id)
    SELECT voter_id, 10, 'Voto acertado en propuesta aprobada', NEW.id
    FROM public.governance_votes WHERE proposal_id = NEW.id AND vote = 'for';

    UPDATE public.user_reputation ur
    SET reputation_points = ur.reputation_points + 10, helpful_votes = ur.helpful_votes + 1, updated_at = NOW()
    FROM public.governance_votes gv
    WHERE gv.proposal_id = NEW.id AND gv.vote = 'for' AND gv.voter_id = ur.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Funciones de Roles
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = check_role AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_roles(check_user_id UUID)
RETURNS user_role[] AS $$
DECLARE
  roles user_role[];
BEGIN
  SELECT ARRAY_AGG(role) INTO roles FROM public.user_roles
  WHERE user_id = check_user_id AND is_active = true AND (expires_at IS NULL OR expires_at > NOW());
  IF roles IS NULL THEN RETURN ARRAY['user']::user_role[]; END IF;
  RETURN roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_highest_role(check_user_id UUID)
RETURNS user_role AS $$
DECLARE
  highest user_role;
BEGIN
  SELECT role INTO highest FROM public.user_roles
  WHERE user_id = check_user_id AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY CASE role
    WHEN 'council' THEN 5 WHEN 'admin' THEN 4 WHEN 'mentor' THEN 3
    WHEN 'candidate_mentor' THEN 2 WHEN 'user' THEN 1
  END DESC LIMIT 1;
  IF highest IS NULL THEN RETURN 'user'::user_role; END IF;
  RETURN highest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Funciones de Quiz y Certificados
-- =====================================================
CREATE OR REPLACE FUNCTION get_best_quiz_attempt(p_user_id UUID, p_module_id UUID)
RETURNS TABLE (id UUID, score INTEGER, passed BOOLEAN, completed_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT qa.id, qa.score, qa.passed, qa.completed_at
  FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.module_id = p_module_id
  ORDER BY qa.score DESC, qa.completed_at DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_passed_module_quiz(p_user_id UUID, p_module_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_passed BOOLEAN;
BEGIN
  SELECT qa.passed INTO v_passed FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id AND qa.module_id = p_module_id AND qa.passed = true
  ORDER BY qa.completed_at DESC LIMIT 1;
  RETURN COALESCE(v_passed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_module_accessible(p_user_id UUID, p_module_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_module_order INTEGER;
  v_course_id UUID;
  v_is_free BOOLEAN;
  v_previous_module_id UUID;
  v_previous_requires_quiz BOOLEAN;
  v_passed_previous BOOLEAN;
BEGIN
  SELECT m.order_index, m.course_id, c.is_free INTO v_module_order, v_course_id, v_is_free
  FROM public.modules m JOIN public.courses c ON m.course_id = c.id WHERE m.id = p_module_id;

  IF v_module_order = 1 THEN RETURN true; END IF;
  IF v_is_free THEN RETURN false; END IF;

  SELECT id, requires_quiz INTO v_previous_module_id, v_previous_requires_quiz
  FROM public.modules WHERE course_id = v_course_id AND order_index = v_module_order - 1;

  IF NOT v_previous_requires_quiz THEN RETURN true; END IF;
  v_passed_previous := has_passed_module_quiz(p_user_id, v_previous_module_id);
  RETURN v_passed_previous;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count FROM public.certificates
  WHERE EXTRACT(YEAR FROM issued_at) = EXTRACT(YEAR FROM NOW());
  RETURN 'NODO360-' || v_year || '-' || LPAD(v_count::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION issue_module_certificate(p_user_id UUID, p_module_id UUID, p_quiz_attempt_id UUID)
RETURNS UUID AS $$
DECLARE
  v_certificate_id UUID;
  v_course_id UUID;
  v_module_title TEXT;
  v_certificate_number TEXT;
  v_passed BOOLEAN;
BEGIN
  SELECT passed INTO v_passed FROM public.quiz_attempts
  WHERE id = p_quiz_attempt_id AND user_id = p_user_id AND module_id = p_module_id;
  IF NOT v_passed THEN RAISE EXCEPTION 'Cannot issue certificate: quiz not passed'; END IF;

  SELECT id INTO v_certificate_id FROM public.certificates WHERE user_id = p_user_id AND module_id = p_module_id;
  IF v_certificate_id IS NOT NULL THEN RETURN v_certificate_id; END IF;

  SELECT m.course_id, m.title INTO v_course_id, v_module_title FROM public.modules m WHERE m.id = p_module_id;
  v_certificate_number := generate_certificate_number();

  INSERT INTO public.certificates (user_id, course_id, module_id, type, certificate_number, title, description)
  VALUES (p_user_id, v_course_id, p_module_id, 'module', v_certificate_number, v_module_title, 'Certificado de completación del módulo')
  RETURNING id INTO v_certificate_id;

  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para quiz_questions updated_at
CREATE OR REPLACE FUNCTION update_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- #####################################################
-- SECCIÓN 13: TRIGGERS
-- #####################################################

-- === Triggers de updated_at ===
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_lesson_notes_updated_at ON public.user_lesson_notes;
CREATE TRIGGER user_lesson_notes_updated_at BEFORE UPDATE ON public.user_lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_quiz_questions_updated_at();

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_user_roles_updated_at();

-- === Trigger: Crear usuario en public.users al registrarse ===
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- === Triggers de Gamificación ===
DROP TRIGGER IF EXISTS trigger_create_user_stats ON public.users;
CREATE TRIGGER trigger_create_user_stats
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_user_stats();

DROP TRIGGER IF EXISTS trigger_update_stats_on_xp ON public.xp_events;
CREATE TRIGGER trigger_update_stats_on_xp
  AFTER INSERT ON public.xp_events
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_xp();

DROP TRIGGER IF EXISTS trigger_award_xp_lesson ON public.user_progress;
CREATE TRIGGER trigger_award_xp_lesson
  AFTER INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lesson_complete();

DROP TRIGGER IF EXISTS trigger_check_badges ON public.xp_events;
CREATE TRIGGER trigger_check_badges
  AFTER INSERT ON public.xp_events
  FOR EACH ROW EXECUTE FUNCTION check_badges_on_xp();

-- === Triggers de Contadores ===
DROP TRIGGER IF EXISTS trigger_update_course_module_count ON public.modules;
CREATE TRIGGER trigger_update_course_module_count
  AFTER INSERT OR DELETE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_course_module_count();

DROP TRIGGER IF EXISTS trigger_update_lesson_counts ON public.lessons;
CREATE TRIGGER trigger_update_lesson_counts
  AFTER INSERT OR DELETE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_lesson_counts();

-- === Triggers de Enrollments ===
DROP TRIGGER IF EXISTS trg_update_enrolled_count ON public.course_enrollments;
CREATE TRIGGER trg_update_enrolled_count
  AFTER INSERT OR DELETE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_enrolled_count();

DROP TRIGGER IF EXISTS trg_update_last_accessed ON public.course_enrollments;
CREATE TRIGGER trg_update_last_accessed
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_enrollment_last_accessed();

-- === Triggers de Gobernanza ===
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON public.governance_votes;
CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT ON public.governance_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_proposal_vote_counts();

DROP TRIGGER IF EXISTS trigger_reputation_on_proposal ON public.governance_proposals;
CREATE TRIGGER trigger_reputation_on_proposal
  AFTER UPDATE ON public.governance_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_reputation_on_proposal_pass();


-- #####################################################
-- SECCIÓN 14: ROW LEVEL SECURITY (RLS)
-- #####################################################

-- === RLS: users ===
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);

-- === RLS: courses ===
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT
  USING (status IN ('published', 'coming_soon'));

DROP POLICY IF EXISTS "Instructors can view own courses" ON public.courses;
CREATE POLICY "Instructors can view own courses" ON public.courses FOR SELECT USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can create courses" ON public.courses;
CREATE POLICY "Instructors can create courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = instructor_id);

-- === RLS: modules ===
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON public.modules;
CREATE POLICY "Anyone can view modules of published courses" ON public.modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.status = 'published'));

DROP POLICY IF EXISTS "Instructors can manage own course modules" ON public.modules;
CREATE POLICY "Instructors can manage own course modules" ON public.modules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid()));

-- === RLS: lessons ===
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON public.lessons;
CREATE POLICY "Anyone can view lessons of published courses" ON public.lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.modules JOIN public.courses ON courses.id = modules.course_id
    WHERE modules.id = lessons.module_id AND courses.status = 'published'
  ));

DROP POLICY IF EXISTS "Instructors can manage own course lessons" ON public.lessons;
CREATE POLICY "Instructors can manage own course lessons" ON public.lessons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.modules JOIN public.courses ON courses.id = modules.course_id
    WHERE modules.id = lessons.module_id AND courses.instructor_id = auth.uid()
  ));

-- === RLS: user_progress ===
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- === RLS: bookmarks ===
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- === RLS: notes ===
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notes" ON public.notes;
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- === RLS: learning_paths ===
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active learning paths" ON public.learning_paths;
CREATE POLICY "Anyone can view active learning paths" ON public.learning_paths FOR SELECT USING (is_active = true);

-- === RLS: learning_path_courses ===
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view learning path courses" ON public.learning_path_courses;
CREATE POLICY "Anyone can view learning path courses" ON public.learning_path_courses FOR SELECT USING (true);

-- === RLS: path_courses ===
ALTER TABLE public.path_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view path courses" ON public.path_courses;
CREATE POLICY "Anyone can view path courses" ON public.path_courses FOR SELECT USING (true);

-- === RLS: user_selected_paths ===
ALTER TABLE public.user_selected_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own selected paths" ON public.user_selected_paths;
CREATE POLICY "Users can view own selected paths" ON public.user_selected_paths FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select paths" ON public.user_selected_paths;
CREATE POLICY "Users can select paths" ON public.user_selected_paths FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own paths" ON public.user_selected_paths;
CREATE POLICY "Users can update own paths" ON public.user_selected_paths FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === RLS: user_gamification_stats ===
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats" ON public.user_gamification_stats;
CREATE POLICY "Users can view own stats" ON public.user_gamification_stats FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all stats for leaderboard" ON public.user_gamification_stats;
CREATE POLICY "Users can view all stats for leaderboard" ON public.user_gamification_stats FOR SELECT USING (true);

-- === RLS: xp_events ===
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own xp events" ON public.xp_events;
CREATE POLICY "Users can view own xp events" ON public.xp_events FOR SELECT USING (auth.uid() = user_id);

-- === RLS: badges ===
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active badges" ON public.badges;
CREATE POLICY "Anyone can view active badges" ON public.badges FOR SELECT USING (is_active = true);

-- === RLS: user_badges ===
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all badges for display" ON public.user_badges;
CREATE POLICY "Users can view all badges for display" ON public.user_badges FOR SELECT USING (true);

-- === RLS: user_lesson_notes ===
ALTER TABLE public.user_lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lesson notes" ON public.user_lesson_notes;
CREATE POLICY "Users can view own lesson notes" ON public.user_lesson_notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lesson notes" ON public.user_lesson_notes;
CREATE POLICY "Users can insert own lesson notes" ON public.user_lesson_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lesson notes" ON public.user_lesson_notes;
CREATE POLICY "Users can update own lesson notes" ON public.user_lesson_notes FOR UPDATE USING (auth.uid() = user_id);

-- === RLS: course_final_quiz_attempts ===
ALTER TABLE public.course_final_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own course final quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can view own course final quiz attempts" ON public.course_final_quiz_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own course final quiz attempts" ON public.course_final_quiz_attempts;
CREATE POLICY "Users can insert own course final quiz attempts" ON public.course_final_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- === RLS: governance_categories ===
ALTER TABLE public.governance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.governance_categories;
CREATE POLICY "Anyone can view categories" ON public.governance_categories FOR SELECT USING (true);

-- === RLS: governance_proposals ===
ALTER TABLE public.governance_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public proposals" ON public.governance_proposals;
CREATE POLICY "Anyone can view public proposals" ON public.governance_proposals FOR SELECT USING (status NOT IN ('draft'));

DROP POLICY IF EXISTS "Authors can view own drafts" ON public.governance_proposals;
CREATE POLICY "Authors can view own drafts" ON public.governance_proposals FOR SELECT USING (author_id = auth.uid() AND status = 'draft');

DROP POLICY IF EXISTS "Authenticated users can create proposals" ON public.governance_proposals;
CREATE POLICY "Authenticated users can create proposals" ON public.governance_proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authors can update own drafts" ON public.governance_proposals;
CREATE POLICY "Authors can update own drafts" ON public.governance_proposals FOR UPDATE USING (author_id = auth.uid() AND status = 'draft');

-- === RLS: governance_votes ===
ALTER TABLE public.governance_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can vote" ON public.governance_votes;
CREATE POLICY "Authenticated users can vote" ON public.governance_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Anyone can view votes" ON public.governance_votes;
CREATE POLICY "Anyone can view votes" ON public.governance_votes FOR SELECT USING (true);

-- === RLS: user_reputation ===
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reputation" ON public.user_reputation;
CREATE POLICY "Users can view own reputation" ON public.user_reputation FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view reputation ranking" ON public.user_reputation;
CREATE POLICY "Anyone can view reputation ranking" ON public.user_reputation FOR SELECT USING (true);

-- === RLS: reputation_history ===
ALTER TABLE public.reputation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reputation history" ON public.reputation_history;
CREATE POLICY "Users can view own reputation history" ON public.reputation_history FOR SELECT USING (auth.uid() = user_id);

-- === RLS: user_roles ===
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- === RLS: course_enrollments ===
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can create own enrollments" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can update own enrollments" ON public.course_enrollments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can delete own enrollments" ON public.course_enrollments FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.course_enrollments;
CREATE POLICY "Instructors can view course enrollments" ON public.course_enrollments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_enrollments.course_id AND courses.instructor_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- === RLS: quiz_questions ===
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz questions are viewable by everyone" ON public.quiz_questions;
CREATE POLICY "Quiz questions are viewable by everyone" ON public.quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors can insert quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can insert quiz questions" ON public.quiz_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Instructors can update quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can update quiz questions" ON public.quiz_questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Instructors can delete quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can delete quiz questions" ON public.quiz_questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  ));

-- === RLS: quiz_attempts ===
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can view attempts for their courses" ON public.quiz_attempts;
CREATE POLICY "Instructors can view attempts for their courses" ON public.quiz_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON m.course_id = c.id
    WHERE m.id = module_id AND c.instructor_id = auth.uid()
  ));

-- === RLS: certificates ===
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Certificates are publicly verifiable" ON public.certificates;
CREATE POLICY "Certificates are publicly verifiable" ON public.certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only authenticated users can insert certificates" ON public.certificates;
CREATE POLICY "Only authenticated users can insert certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);


-- #####################################################
-- SECCIÓN 15: VISTAS
-- #####################################################

-- Vista de propuestas con detalles
DROP VIEW IF EXISTS public.proposals_with_details;
CREATE OR REPLACE VIEW public.proposals_with_details AS
SELECT
  p.*,
  u.full_name as author_name,
  u.avatar_url as author_avatar,
  u.role as author_role,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  public.calculate_gpower(p.author_id) as author_gpower,
  CASE
    WHEN p.voting_ends_at IS NOT NULL AND p.voting_ends_at > NOW()
    THEN EXTRACT(EPOCH FROM (p.voting_ends_at - NOW()))::INTEGER
    ELSE 0
  END as seconds_remaining
FROM public.governance_proposals p
JOIN public.users u ON u.id = p.author_id
LEFT JOIN public.governance_categories c ON c.id = p.category_id;

-- Vista de usuarios con roles
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.avatar_url,
  COALESCE(
    (SELECT ARRAY_AGG(ur.role ORDER BY
      CASE ur.role
        WHEN 'council' THEN 5 WHEN 'admin' THEN 4 WHEN 'mentor' THEN 3
        WHEN 'candidate_mentor' THEN 2 WHEN 'user' THEN 1
      END DESC
    ) FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.is_active = true),
    ARRAY['user']::user_role[]
  ) as roles,
  public.get_highest_role(u.id) as highest_role
FROM public.users u;


-- #####################################################
-- SECCIÓN 16: DATOS INICIALES (SEED DATA)
-- #####################################################

-- === Badges iniciales ===
INSERT INTO public.badges (slug, title, description, icon, category, rarity, xp_reward, requirement_type, requirement_value, order_index) VALUES
('first-lesson', 'Primera Lección', 'Completaste tu primera lección', '🎯', 'achievement', 'common', 5, 'lessons_completed', 1, 1),
('aprendiz', 'Aprendiz', 'Completaste 10 lecciones', '📚', 'milestone', 'common', 25, 'lessons_completed', 10, 2),
('estudioso', 'Estudioso', 'Completaste 25 lecciones', '📖', 'milestone', 'rare', 50, 'lessons_completed', 25, 3),
('erudito', 'Erudito', 'Completaste 50 lecciones', '🎓', 'milestone', 'epic', 100, 'lessons_completed', 50, 4),
('maestro', 'Maestro del Conocimiento', 'Completaste 100 lecciones', '👨‍🎓', 'milestone', 'legendary', 250, 'lessons_completed', 100, 5),
('first-course', 'Primer Curso', 'Completaste tu primer curso', '🏆', 'achievement', 'common', 50, 'courses_completed', 1, 10),
('dedicado', 'Dedicado', 'Completaste 3 cursos', '💎', 'milestone', 'rare', 150, 'courses_completed', 3, 11),
('experto', 'Experto', 'Completaste 5 cursos', '⭐', 'milestone', 'epic', 300, 'courses_completed', 5, 12),
('racha-7', 'Racha Semanal', '7 días seguidos aprendiendo', '🔥', 'achievement', 'rare', 75, 'streak_days', 7, 20),
('racha-30', 'Racha Mensual', '30 días seguidos aprendiendo', '🌟', 'achievement', 'epic', 200, 'streak_days', 30, 21),
('racha-100', 'Racha Centenaria', '100 días seguidos aprendiendo', '💫', 'achievement', 'legendary', 500, 'streak_days', 100, 22),
('nivel-5', 'Nivel 5', 'Alcanzaste el nivel 5', '🥉', 'milestone', 'common', 0, 'total_xp', 400, 30),
('nivel-10', 'Nivel 10', 'Alcanzaste el nivel 10', '🥈', 'milestone', 'rare', 0, 'total_xp', 1400, 31),
('nivel-20', 'Nivel 20', 'Alcanzaste el nivel 20', '🥇', 'milestone', 'epic', 0, 'total_xp', 4400, 32),
('early-adopter', 'Early Adopter', 'Usuario de las primeras 100 personas', '🚀', 'special', 'legendary', 500, 'lessons_completed', 1, 100),
('crypto-master', 'Crypto Master', 'Completaste todos los cursos de Bitcoin', '₿', 'special', 'legendary', 1000, 'courses_completed', 3, 101)
ON CONFLICT (slug) DO NOTHING;

-- === Rutas de aprendizaje iniciales ===
INSERT INTO public.learning_paths (slug, title, name, description, icon, emoji, difficulty, estimated_hours, order_index, color_from, color_to) VALUES
('bitcoin-fundamentals', 'Ruta Bitcoin', 'Ruta Bitcoin', 'Domina Bitcoin desde los fundamentos hasta conceptos avanzados.', '₿', '₿', 'beginner', 40, 1, 'orange-500', 'yellow-500'),
('ethereum-developer', 'Ruta Ethereum', 'Ruta Ethereum', 'Conviértete en desarrollador blockchain. Aprende Solidity, smart contracts y dApps.', '⟠', '⟠', 'intermediate', 60, 2, 'purple-500', 'blue-500'),
('crypto-full-stack', 'Ruta Full-Stack Crypto', 'Ruta Full-Stack Crypto', 'Stack completo de desarrollo blockchain.', '🚀', '🚀', 'advanced', 100, 3, 'green-500', 'teal-500')
ON CONFLICT (slug) DO NOTHING;

-- === Categorías de gobernanza ===
INSERT INTO public.governance_categories (slug, name, description, icon, color, proposal_level, order_index) VALUES
('ui-ux', 'Interfaz y Experiencia', 'Mejoras de diseño y usabilidad', '🎨', '#ff6b35', 1, 1),
('contenido', 'Contenido Educativo', 'Sugerencias de temas y materiales', '📚', '#f7931a', 1, 2),
('comunidad', 'Comunidad', 'Eventos, iniciativas sociales', '👥', '#10b981', 1, 3),
('gamificacion', 'Gamificación', 'Badges, XP, recompensas', '🎮', '#8b5cf6', 1, 4),
('nuevos-cursos', 'Nuevos Cursos', 'Propuestas de cursos completos', '🎓', '#3b82f6', 2, 5),
('politicas', 'Políticas', 'Reglas y normas de la plataforma', '📜', '#ef4444', 2, 6),
('tecnologia', 'Tecnología', 'Features técnicas importantes', '⚙️', '#6366f1', 2, 7),
('gobernanza', 'Gobernanza', 'Cambios al sistema de gobernanza', '🏛️', '#f59e0b', 2, 8)
ON CONFLICT (slug) DO NOTHING;


-- #####################################################
-- SECCIÓN 17: COMENTARIOS DE DOCUMENTACIÓN
-- #####################################################

COMMENT ON TABLE public.users IS 'Perfiles de usuarios de la plataforma';
COMMENT ON TABLE public.courses IS 'Cursos disponibles en la plataforma';
COMMENT ON TABLE public.modules IS 'Módulos (secciones) dentro de cada curso';
COMMENT ON TABLE public.lessons IS 'Lecciones individuales dentro de módulos';
COMMENT ON TABLE public.user_progress IS 'Progreso del usuario en lecciones';
COMMENT ON TABLE public.bookmarks IS 'Marcadores de lecciones por usuario';
COMMENT ON TABLE public.notes IS 'Notas de lecciones por usuario';
COMMENT ON TABLE public.learning_paths IS 'Rutas de aprendizaje disponibles en la plataforma';
COMMENT ON TABLE public.learning_path_courses IS 'Cursos asignados a cada ruta de aprendizaje';
COMMENT ON TABLE public.path_courses IS 'Cursos que pertenecen a cada ruta (legacy)';
COMMENT ON TABLE public.user_selected_paths IS 'Rutas seleccionadas por cada usuario';
COMMENT ON TABLE public.user_gamification_stats IS 'Estadísticas de gamificación por usuario';
COMMENT ON TABLE public.xp_events IS 'Registro de eventos de XP';
COMMENT ON TABLE public.badges IS 'Catálogo de badges disponibles';
COMMENT ON TABLE public.user_badges IS 'Badges desbloqueados por usuarios';
COMMENT ON TABLE public.user_lesson_notes IS 'Notas por lección de usuario (v2)';
COMMENT ON TABLE public.course_final_quiz_attempts IS 'Intentos de quiz final de curso';
COMMENT ON TABLE public.governance_categories IS 'Categorías para propuestas de gobernanza';
COMMENT ON TABLE public.governance_proposals IS 'Propuestas de gobernanza de la comunidad';
COMMENT ON TABLE public.governance_votes IS 'Votos en propuestas de gobernanza';
COMMENT ON TABLE public.user_reputation IS 'Puntos de reputación por usuario';
COMMENT ON TABLE public.reputation_history IS 'Historial de cambios de reputación';
COMMENT ON TABLE public.user_roles IS 'Sistema de roles multi-nivel para usuarios';
COMMENT ON TABLE public.course_enrollments IS 'Inscripciones de usuarios en cursos';
COMMENT ON TABLE public.quiz_questions IS 'Preguntas de quiz por módulo';
COMMENT ON TABLE public.quiz_attempts IS 'Intentos de quiz por usuario';
COMMENT ON TABLE public.certificates IS 'Certificados emitidos a usuarios';

COMMENT ON FUNCTION public.handle_new_user IS 'Crea perfil de usuario automáticamente al registrarse';
COMMENT ON FUNCTION public.calculate_level_from_xp IS 'Calcula nivel desde XP total';
COMMENT ON FUNCTION public.calculate_gpower IS 'Calcula poder de gobernanza de un usuario';
COMMENT ON FUNCTION public.has_role IS 'Verifica si un usuario tiene un rol específico activo';
COMMENT ON FUNCTION public.get_user_roles IS 'Obtiene todos los roles activos de un usuario';
COMMENT ON FUNCTION public.get_highest_role IS 'Obtiene el rol de mayor jerarquía de un usuario';
COMMENT ON FUNCTION public.generate_certificate_number IS 'Genera número único de certificado';


-- #####################################################
-- FIN DEL SCHEMA COMPLETO
-- #####################################################
-- Total tablas: 27
-- Total funciones: 22
-- Total triggers: 18
-- Total políticas RLS: 60+
-- Total vistas: 2
--
-- Para verificar, ejecutar:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- #####################################################
